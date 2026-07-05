/**
 * actionEffectsProse — the plain-prose "effects line" for an action (THR-639).
 *
 * One plain-register sentence stating what an action does, what it touches, and
 * what it costs — the line the player reads on a focused ActionCard face (both the
 * Action Drawer and the Ascendant Beat unlock modal share it). Distinct from
 * `template.technicalEffect`, which is the wiki-facing mechanical "Effect" block
 * (THR-610); this is player prose, second person, addressed to the god.
 *
 * Voice: plainspoken Malazan baseline, no peak lyricism — these are instructional
 * lines the player reads while deciding (THR-609: interactive text is always plain).
 *
 * Resolution order (composition-first with authored overrides, mirroring the
 * Motive Receipt pattern, THR-631):
 *   1. ACTION_EFFECTS_PROSE[template.id] — authored override body.
 *   2. Composed fallback from crudType + targetCategories (what it does + what it
 *      touches), degrading to a reach-generic when it cannot classify.
 * The essence-cost clause is appended uniformly at the end so the cost is always
 * interpolated from the template, never hardcoded in an authored string.
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';

// ─── Constants (NFP #1) ──────────────────────────────────────────────────────

/**
 * Soft cap for authored effects-line bodies (the sentence before the cost clause).
 * Advisory — enforced by review discipline, not at runtime.
 */
export const EFFECTS_LINE_MAX_CHARS = 140;

// ─── Authored overrides ──────────────────────────────────────────────────────

/**
 * Authored effect bodies for every grantable action (all spine + pool beat
 * `grantsActionIds`, enumerated from `ascendant-beat-content.ts`). Bodies carry NO
 * cost — the cost clause is appended by `actionEffectsProse`. Keep each ≤
 * EFFECTS_LINE_MAX_CHARS, plainspoken, second person addressing the god.
 */
export const ACTION_EFFECTS_PROSE: Record<string, string> = {
  // — First Thread + starter pool: attention & sight —
  bind_thread_agent:
    'Draws a thread of your attention to a mortal, opening your divine actions upon them.',
  bind_thread_location:
    'Draws a thread to a place, letting you watch it and act upon it from afar.',
  observe_agent:
    'Turns your sight on a mortal, laying bare what they can do and what weighs on them.',

  // — Interventions granted by the introduction beat —
  'divine.persuade':
    "Presses a conviction into a mortal's mind, bending them toward the course you choose.",
  'divine.dream':
    'Sends a dream to a sleeping mortal, reshaping what they want beneath waking thought.',
  'divine.omen':
    'Sets a sign in the world for mortals to read, pulling those who heed it toward your intent.',
  'divine.inspire':
    'Kindles sudden purpose in a mortal, driving them to pursue a calling with fierce resolve.',

  // — Per-graph expression verbs (imbue / consecrate / bestow / anoint) —
  'action.imbue':
    'Presses a sliver of your nature into an artifact, waking a power shaped by your sphere.',
  'action.consecrate':
    'Hallows a holy place so the faithful gathered there are drawn toward your design, while you sustain it.',
  'action.consecrate-relic':
    'Enshrines a relic that keeps a holy place hallowed on its own — until the relic is destroyed.',
  'action.bestow':
    'Leaves a portion of your strength in a faithful mortal, quickening them in your art.',
  'action.anoint':
    'Marks a whole faction as chosen, lifting every hand that serves under it while your regard holds.',

  // — Divine-economy source loop (THR-611) —
  'loc.find_source':
    'Casts your sight across the land to reveal hidden wellsprings of essence you might claim.',
  'loc.claim_source':
    'Takes an uncontrolled wellspring for your own, and it begins to feed you the essence of its nature.',
  'loc.consecrate_source':
    'Dedicates a place to your foremost sphere as a wellspring that feeds you — dormant at first, but yours to raise.',
  'loc.sanctify_source':
    'Pours devotion into a wellspring you hold, drawing it toward its flowering and far greater yield.',
  'loc.defend_source':
    'Drives off whatever bleeds a wellspring of yours and mends it, holding it against rival gods.',
};

// ─── Composed fallback ───────────────────────────────────────────────────────

/** Category → the phrase naming what an action touches. First declared category wins. */
const TARGET_PHRASE: Record<string, string> = {
  actor: 'a mortal',
  agent: 'a mortal',
  location: 'a place',
  sublocation: 'a place',
  hex: 'the land',
  artifact: 'an artifact',
  artifact_legendary: 'a legendary artifact',
  faction: 'a faction',
  resource: 'a wellspring',
};

/** crudType → a verb frame that takes a target phrase. */
const CRUD_FRAME: Record<UnifiedActionTemplate['crudType'], (target: string) => string> = {
  create: (t) => `Reaches out to ${t}, drawing it into your design.`,
  read: (t) => `Turns your sight on ${t}, revealing what is hidden there.`,
  update: (t) => `Works your will upon ${t}, reshaping it toward your intent.`,
  delete: (t) => `Unmakes ${t}, undoing what it was.`,
};

function targetPhrase(categories: UnifiedActionTemplate['targetCategories']): string | null {
  // Omitted/empty defaults to ['actor'] per the template contract.
  const first = categories && categories.length > 0 ? categories[0] : 'actor';
  return TARGET_PHRASE[first as string] ?? null;
}

function capitalize(word: string): string {
  return word.length ? word[0].toUpperCase() + word.slice(1) : word;
}

/** Assemble a body from crudType + target, degrading to a reach-generic line. */
function composedFallback(template: UnifiedActionTemplate): string {
  const target = targetPhrase(template.targetCategories);
  const frame = CRUD_FRAME[template.crudType];
  if (frame && target) return frame(target);
  return `A new power of the ${capitalize(String(template.reach))} reach.`;
}

// ─── Cost clause ─────────────────────────────────────────────────────────────

function costClause(essenceCost: number | undefined): string {
  if (essenceCost && essenceCost > 0) return ` Costs ${Math.round(essenceCost)} essence.`;
  return '';
}

// ─── Public entry ────────────────────────────────────────────────────────────

/**
 * The plain-prose effects line for a template: authored override (or composed
 * fallback) followed by the interpolated cost clause. Deterministic — depends only
 * on the template. Never throws.
 */
export function actionEffectsProse(template: UnifiedActionTemplate): string {
  const body = ACTION_EFFECTS_PROSE[template.id] ?? composedFallback(template);
  return `${body}${costClause(template.essenceCost)}`;
}
