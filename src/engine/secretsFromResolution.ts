/**
 * Secrets & Favors — birth at the live resolution seam (THR-724)
 *
 * The `secretDiscovery` / `favorGeneration` template metadata has existed since
 * THR-30, but the only code that read it lived in `phaseEncounterProgressionV2`,
 * which walks `state.encounterProgress` — a list that is empty for the whole of a
 * standard run. The live pipeline resolves `state.unifiedActions`, so the metadata
 * was never consulted and a 120-tick run produced zero `knows_secret_of` and zero
 * `owes_favor` edges.
 *
 * This module is the missing read site. It runs once per newly-resolved action, in
 * the orchestrator's newly-resolved transition, before the resolved-action prune.
 *
 * ─── Determinism ──────────────────────────────────────────────────
 * Seeded per (worldSeed, tick, actionId) — same seed + same inputs → same secrets.
 * No Math.random.
 *
 * ─── Fail-soft ────────────────────────────────────────────────────
 * Every path is wrapped by the caller and returns silently on missing nodes; a
 * secret that cannot be born is simply not born. The tick loop never sees a throw.
 */

import type { GameState } from '../types/gameState';
import type { UnifiedAction } from '../types/unifiedAction';
import type { SimulationRuntime } from './simulationRuntime';
import { getAnyEncounterById } from '../data/encounter-content';
import { generateSecret, createSecretEdge, createFavorEdge, pickSecretSubject } from './secretGeneration';
import { emitTrace } from './traceBuffer';
import { touchWorld } from './simulationRuntime';
import { mulberry32 } from '../lib/prng';

/** Simple string hash for deterministic PRNG seeding (mirrors orchestrator.ts). */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

// ─── Constants ─────────────────────────────────────────────────────────────

/** PRNG stream offset for subject selection — keeps subject and magnitude rolls independent. */
const SECRET_SUBJECT_SEED_SALT = 53;

/** PRNG stream offset for favor magnitude sampling. */
const FAVOR_SEED_SALT = 61;

/** Outcomes that count as "the encounter succeeded" for secret/favor birth. */
const SUCCESS_OUTCOMES = new Set(['success', 'critical_success', 'success_at_cost']);

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Apply `secretDiscovery` / `favorGeneration` template metadata for one
 * newly-resolved action. Mutates the graph in place; returns nothing.
 *
 * Subject resolution: the action's explicit `targetId` when it names an actor,
 * otherwise a seeded pick among agents co-located with the actor. Most live
 * encounters target a location, so the fallback is the common path.
 */
export function applySecretsFavorsFromResolvedAction(
  state: GameState,
  action: UnifiedAction,
  runtime?: SimulationRuntime,
): void {
  if (!SUCCESS_OUTCOMES.has(action.outcome ?? '')) return;

  const template = getAnyEncounterById(action.templateId);
  if (!template) return;
  if (!template.secretDiscovery?.onSuccess && !template.favorGeneration?.onSuccess) return;

  const { graph, tick } = state;
  const actorId = action.actorId;
  if (!graph.getNode(actorId)) return;

  const subjectRng = mulberry32(
    (state.seed ^ tick * SECRET_SUBJECT_SEED_SALT ^ hashString(action.actionId)) >>> 0,
  );

  const explicitTarget = action.targetId && graph.getNode(action.targetId)?.type === 'actor'
    ? action.targetId
    : undefined;
  const subjectId = explicitTarget ?? pickSecretSubject(actorId, graph, subjectRng);
  if (!subjectId || subjectId === actorId) return;

  if (template.secretDiscovery?.onSuccess) {
    const source = template.secretDiscovery.sourceName;
    const secret = generateSecret(graph.getNode(subjectId)!, graph, source, subjectRng);
    const created = createSecretEdge(actorId, subjectId, secret, source, tick, graph);
    if (created) {
      if (runtime) touchWorld(runtime);
      emitTrace({
        tick,
        category: 'secret_discovered',
        agentId: actorId,
        summary: `${actorId} learned a secret (${created.secretType}, mag ${created.magnitude.toFixed(2)}) about ${subjectId} via ${action.templateId} [${source}]`,
      });
    }
  }

  if (template.favorGeneration?.onSuccess) {
    const [magMin, magMax] = template.favorGeneration.magnitudeRange;
    const favorRng = mulberry32(
      (state.seed ^ tick * FAVOR_SEED_SALT ^ hashString(action.actionId)) >>> 0,
    );
    const magnitude = magMin + favorRng() * (magMax - magMin);
    // debtor = the agent who was helped (subject), creditor = the actor who helped
    const created = createFavorEdge(
      subjectId, actorId, magnitude, template.favorGeneration.context, tick, graph,
    );
    if (created) {
      if (runtime) touchWorld(runtime);
      emitTrace({
        tick,
        category: 'favor_created',
        agentId: actorId,
        summary: `${subjectId} owes ${actorId} a favor (${template.favorGeneration.context}, mag ${magnitude.toFixed(2)}) via ${action.templateId}`,
      });
    }
  }
}
