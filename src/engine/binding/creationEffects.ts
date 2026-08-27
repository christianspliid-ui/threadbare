/**
 * Banded creation effects — THR-1296 §3 (THR-1290 §4), slice 5.
 *
 * An undertaking's checkpoints are where its story happens, and until this module the
 * only thing a checkpoint could do was move a number. `StrategicMutationHint` builds
 * at *completion* and has never been able to make a person at all — so a three-month
 * undertaking to found a chapterhouse produced nothing observable until the day it
 * finished, and a catastrophic failure produced nothing observable ever.
 *
 * ## The band rule, entire
 *
 * | checkpoint | creates |
 * |---|---|
 * | `advance` | `onAdvance` — the work bears fruit |
 * | `advance_at_cost` | `onAtCost` — it bears fruit *and* the cost is a thing in the world |
 * | `halt` | nothing. A halt is a stall, and a stall leaves no artifact |
 * | band `critical_failure` | `onCritFailure` — the disaster is a thing in the world |
 *
 * `critical_failure` is read off the **band**, not the effect, because it maps to
 * `halt` (`CHECKPOINT_EFFECT_BY_BAND`) and would otherwise be the one outcome that
 * can never put anything in the world — which is exactly backwards for the band whose
 * whole job is to leave a mark.
 *
 * ## Two ways to make a person, and why the split is load-bearing
 *
 * - `must-persist` → the **mint valve** (§5). Budgeted at `BINDER_MINT_BUDGET_PER_TICK`,
 *   request-derived rng, born real: capabilities, values, a name from the local culture,
 *   an ambition. Registered in the binding ledger, so a reaper taking them is a
 *   complication rather than a silence.
 * - `scene-only` → an immediate walk-on through `materializeWalkOnActor`, the encounter
 *   support bundle's own writer. Cardboard, unbudgeted, gone when the scene is.
 *
 * Routing every spawn through the valve would spend the birth budget on faces; routing
 * every spawn through the walk-on writer would fill the world with people who cannot
 * hold an ambition. The declaration picks, per effect.
 *
 * ## Idempotency
 *
 * A `must-persist` spawn with no authored `castKey` derives one from its band and role,
 * so an undertaking that advances five times makes **one** steward, not five. An author
 * who wants five says so with five keys. `enqueueMint` and `mintNodeId` are both
 * idempotent per `(projectId, castKey)`, so the guarantee holds through the queue.
 *
 * Fail-soft throughout (NFP #4): every branch traces its refusal and returns; nothing
 * here can throw into the tick loop.
 */
import type { GameState } from '../../types/gameState';
import type { WorldGraph } from '../graph';
import type {
  StrategicActionTemplate,
  StrategicProjectRuntime,
  UndertakingCheckpointEffect,
  UndertakingCreationEffect,
  UndertakingMintRequest,
} from '../../types/strategicAction';
import type { StepOutcome } from '../../types/unifiedAction';
import { emitTrace } from '../traceBuffer';
import type { TraceEntry } from '../../types/trace';
import { createSublocation } from '../strategicGraphOps';
import { materializeWalkOnActor } from '../encounterSupportBundle';
import { resolveToParentLocation } from '../sublocationShape';
import { enqueueMint, mintNodeId } from './mintInhabitant';
import { generateWorkName } from '../naming/workNames';

export interface CreationEffectsInput {
  readonly state: GameState;
  readonly graph: WorldGraph;
  readonly project: StrategicProjectRuntime;
  readonly template: StrategicActionTemplate | undefined;
  readonly band: StepOutcome;
  readonly effect: UndertakingCheckpointEffect;
  readonly tick: number;
}

export interface CreationEffectsResult {
  /** Node ids that exist now because of this checkpoint. */
  readonly created: readonly string[];
  /** Mint node ids owed — born at the valve, within `BINDER_MINT_QUEUE_MAX` ticks. */
  readonly queued: readonly string[];
  /** Refusal reasons, in order. Empty on the happy path and on the no-op path alike. */
  readonly refused: readonly string[];
}

const NOTHING: CreationEffectsResult = { created: [], queued: [], refused: [] };

/**
 * Which authored list this checkpoint fires, or `null` for the halt case.
 *
 * Exported because it is the whole band rule and a test should be able to assert it
 * over all six `StepOutcome` values without constructing a world.
 */
export function selectCreationBand(
  effects: StrategicActionTemplate['creationEffects'],
  band: StepOutcome,
  effect: UndertakingCheckpointEffect,
): readonly UndertakingCreationEffect[] | null {
  if (!effects) return null;
  if (band === 'critical_failure') return effects.onCritFailure ?? null;
  if (effect === 'advance') return effects.onAdvance ?? null;
  if (effect === 'advance_at_cost') return effects.onAtCost ?? null;
  return null; // halt creates nothing.
}

/** The ledger key a keyless must-persist spawn takes — see the idempotency note above. */
export function derivedCreationCastKey(band: StepOutcome, role: string): string {
  return `$made_${band}_${role}`;
}

/**
 * Where a creation lands: the stage node itself, and the place tier that owns it.
 *
 * A sublocation stage places a person *in* the sublocation and hangs a new structure
 * off the **parent** — you build a shrine in the town, not inside the counting-house.
 * `parentLocationId` is the sublocation discriminator (THR-1183), asked through the
 * shape helper rather than hand-rolled.
 */
function resolveSite(
  graph: WorldGraph,
  project: StrategicProjectRuntime,
): { readonly placementId: string; readonly parentPlaceId: string } | null {
  const siteId = project.targetNodeId ?? project.originLocationId;
  if (!siteId) return null;
  const node = graph.getNode(siteId);
  if (!node) return null;
  const parent = resolveToParentLocation(graph, node);
  return { placementId: node.id, parentPlaceId: parent?.id ?? node.id };
}

function trace(
  input: CreationEffectsInput,
  kind: string,
  outcome: 'created' | 'queued' | 'refused',
  detail: string,
): void {
  emitTrace({
    category: 'strategic_project_progress',
    tick: input.tick,
    actorId: input.project.actorId,
    projectId: input.project.projectId,
    progress: input.project.progress,
    progressRequired: input.project.progressRequired,
    status: 'active',
    summary:
      `creation effect ${kind} ${outcome} on ${input.band}/${input.effect} ` +
      `for ${input.project.templateId}: ${detail}`,
  } as TraceEntry);
}

/**
 * Fire this checkpoint's creation effects.
 *
 * Costs nothing on a template with no `creationEffects` — which is every shipped
 * template in v1 — returning before it resolves a site or touches the graph. That
 * neutrality is pinned by test, so doc 2's first authored band fails one deliberately
 * rather than landing on an unproven seam.
 */
export function applyCreationEffects(input: CreationEffectsInput): CreationEffectsResult {
  const { state, graph, project, template, band, effect, tick } = input;

  const list = selectCreationBand(template?.creationEffects, band, effect);
  if (!list || list.length === 0) return NOTHING;

  const created: string[] = [];
  const queued: string[] = [];
  const refused: string[] = [];

  const site = resolveSite(graph, project);
  if (!site) {
    trace(input, 'all', 'refused', 'no resolvable site');
    return { created, queued, refused: ['no_site'] };
  }

  for (const spawn of list) {
    try {
      if (spawn.kind === 'spawn_sublocation') {
        // THR-1297 §5: the fallback used to be the raw `sublocationTypeId` — a
        // template id on a player-facing surface ("guild_chapter" as a place name),
        // which UI Law 14 and this plan's fail-soft row both forbid. It now routes
        // through the work namer, so an unnamed binder creation gets a real name
        // instead of a database key. An authored `nameTemplate` still wins.
        const name = spawn.nameTemplate ?? generateWorkName({
          workId: `${project.projectId}:${spawn.sublocationTypeId}:${site.parentPlaceId}`,
          kindId: 'sublocation',
          anchorName: graph.getNode(site.parentPlaceId)?.name,
          actorName: graph.getNode(project.actorId)?.name,
          tick,
        });
        const result = createSublocation(
          graph, site.parentPlaceId, project.actorId, name, spawn.sublocationTypeId, tick,
        );
        if (result.success && result.createdId) {
          created.push(result.createdId);
          trace(input, 'spawn_sublocation', 'created', result.createdId);
        } else {
          refused.push(result.error ?? 'create_sublocation_failed');
          trace(input, 'spawn_sublocation', 'refused', result.error ?? 'unknown');
        }
        continue;
      }

      // spawn_npc — the persistence declaration picks the path.
      if (spawn.persistence === 'must-persist') {
        const castKey = spawn.castKey ?? derivedCreationCastKey(band, spawn.role);
        const request: UndertakingMintRequest = {
          projectId: project.projectId,
          castKey,
          stepIndex: project.checkpointIndex ?? 0,
          role: spawn.role,
          placementNodeId: site.placementId,
          persistence: spawn.persistence,
          spawnName: spawn.spawnName,
          factionDefId: spawn.factionDefId,
          identityRequirement: spawn.identityRequirement,
          requestedAtTick: tick,
        };
        const enqueued = enqueueMint(state.strategicState, request, tick);
        if (enqueued.queued) {
          queued.push(enqueued.nodeId);
          trace(input, 'spawn_npc', 'queued', `${enqueued.nodeId} (${castKey})`);
        } else {
          refused.push(enqueued.reason);
          trace(input, 'spawn_npc', 'refused', enqueued.reason);
        }
        continue;
      }

      // scene-only — a walk-on, now, through the encounter path's own writer.
      const nodeId = `undertaking_walkon_${project.projectId}_${spawn.castKey ?? spawn.role}_${tick}`;
      const id = materializeWalkOnActor(state, site.parentPlaceId, site.placementId, {
        nodeId,
        name: spawn.spawnName,
        npcRole: spawn.role,
        supportRole: spawn.role,
        factionDefId: spawn.factionDefId,
        generatedBy: 'undertaking_creation_effect',
        extraProperties: {
          undertakingProjectId: project.projectId,
          undertakingTemplateId: project.templateId,
          createdOnBand: band,
        },
      });
      created.push(id);
      trace(input, 'spawn_npc', 'created', `${id} (scene-only)`);
    } catch (err) {
      // One bad effect must not cost the undertaking its checkpoint (NFP #4).
      const message = err instanceof Error ? err.message : String(err);
      refused.push(`error:${message}`);
      trace(input, spawn.kind, 'refused', message);
    }
  }

  return { created, queued, refused };
}

/** Re-exported so the lifecycle can name a queued mint without importing the valve. */
export { mintNodeId };
