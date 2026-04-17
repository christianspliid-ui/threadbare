/**
 * Hidden Mark Revelation Prose — THR-132
 *
 * Authors chronicle-event messages for mark revelations (encounter-consumed
 * and decay-dropped paths). Category-keyed prose tables live in
 * `src/data/hidden-mark-prose.ts`; this module picks a template
 * deterministically, substitutes the mark-local `{mark_label}` token, then
 * delegates to `enrichProse()` for the shared placeholder vocabulary.
 *
 * Fail-soft chain (NFP #4):
 *   1. gatherNarrativeContext throws → inline minimal context, enrichment still runs.
 *   2. Category table missing/empty → MARK_PROSE_DEFAULT_TEMPLATE.
 *   3. Any uncaught error anywhere → v1 literal `"A buried truth surfaces: ${mark.label}"`.
 *
 * Determinism (NFP #3): template choice seeded from (state.seed, tick, markId)
 * in the same shape as `consumeMatchingMarks`. Same reveal → same prose.
 */

import type { GameState } from '../types/gameState';
import type { HiddenMark } from '../types/unifiedAction';
import { mulberry32 } from '../lib/prng';
import { enrichProse, gatherNarrativeContext, type NarrativeContext } from './proseEnrichment';
import {
  HIDDEN_MARK_ENCOUNTER_REVEAL_PROSE,
  HIDDEN_MARK_DECAY_PROSE,
  MARK_PROSE_DEFAULT_TEMPLATE,
} from '../data/hidden-mark-prose';

/**
 * Generate the player-facing chronicle message for a mark revelation.
 *
 * @param state        current game state (graph used for enrichment context)
 * @param mark         the mark being revealed (consumed or decayed)
 * @param revealedBy   templateId for encounter-consumed reveals, or
 *                     `'decay:severity_floor'` for decay-dropped reveals
 * @param tick         current tick (mixed into the template-seed for determinism)
 */
export function generateMarkRevealMessage(
  state: GameState,
  mark: HiddenMark,
  revealedBy: string,
  tick: number,
): string {
  try {
    const isDecay = revealedBy.startsWith('decay:');
    const table = isDecay
      ? HIDDEN_MARK_DECAY_PROSE[mark.category]
      : HIDDEN_MARK_ENCOUNTER_REVEAL_PROSE[mark.category];

    const pool: readonly string[] =
      table && table.length > 0 ? table : [MARK_PROSE_DEFAULT_TEMPLATE];

    const seed = deriveSeed(state.seed, tick, mark.markId);
    const rng = mulberry32(seed);
    const template = pool[Math.floor(rng() * pool.length)] ?? MARK_PROSE_DEFAULT_TEMPLATE;

    const stage1 = substituteMarkLabel(template, mark);

    let ctx: NarrativeContext;
    try {
      ctx = gatherNarrativeContext(state.graph, mark.targetAgentId);
    } catch {
      ctx = minimalContext(mark);
    }

    return enrichProse(stage1, ctx);
  } catch {
    return `A buried truth surfaces: ${mark.label}`;
  }
}

// ─── Helpers ───────────────────────────────────────────────────────

function deriveSeed(worldSeed: number, tick: number, markId: string): number {
  let s = (worldSeed ^ (tick * 97)) >>> 0;
  for (let i = 0; i < markId.length; i++) {
    s = (s ^ (markId.charCodeAt(i) * 2654435761)) >>> 0;
  }
  return s;
}

function substituteMarkLabel(template: string, mark: HiddenMark): string {
  const label = mark.label && mark.label.length > 0 ? mark.label : 'a buried thing';
  return template.replace(/{mark_label}/g, label);
}

function minimalContext(mark: HiddenMark): NarrativeContext {
  return {
    agentName: 'The marked one',
    agentId: mark.targetAgentId,
    archetypeId: '',
    cultureName: 'unknown culture',
    primaryReach: 'iron',
    titles: [],
    notableArtifacts: [],
    strongAllies: [],
    rivals: [],
    currentLocationName: 'the world',
    completedPhases: [],
    beatHistory: [],
    pronouns: { they: 'they', them: 'them', their: 'their', s: '' },
  };
}
