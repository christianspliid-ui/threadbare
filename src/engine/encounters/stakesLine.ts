/**
 * Encounter stakes line + result line — THR-1727.
 *
 * One formula sentence tells the player what an encounter is about:
 *
 *   `[lead], [actor] must [goal] — or [risk].`
 *
 * and the same parts tell the finished story afterwards, chosen by outcome band:
 *
 *   `[actor] [won].` · `[actor] [won], at a cost.` · `[actor] [lost].` · …
 *
 * The lead clause says why the mortal is here (the motive classification), so the
 * line replaces both the hand-written `template.description` subtitle and the
 * THR-972 motive intro line on the encounter veil.
 *
 * ─── Determinism (NFP #3) ────────────────────────────────────────
 * No rng. The lead variant is `hashSeed(actionId) % n`. The context the lead is
 * built from is frozen on the tick path (`stampStakesContext`), never at render
 * time, so the same seed yields the same line headless and in the browser.
 *
 * ─── Fail-soft (NFP #4) ──────────────────────────────────────────
 * Every missing input degrades to a shorter line — never a raw `{token}`, never
 * a throw. See the plan's fail-soft table.
 *
 * Plan: `Docs/plans/2026-10-04-thr-1727-encounter-stakes-line.md`
 */

import type { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { EncounterStakes, EncounterStakesEndings, StakesContext } from '../../types/encounterStakes';
import {
  isActionStepBranch,
  type UnifiedAction,
  type UnifiedActionTemplate,
} from '../../types/unifiedAction';
import type { EncounterChoiceMemory } from '../../types/encounter';
import type { EncounterStakesLineTrace } from '../../types/trace';
import {
  STAKES_LEAD_VARIANTS,
  STAKES_LINE_MAX_CHARS,
  STAKES_RESULT_FORMS,
  type StakesResultBand,
} from '../../data/nudge-stage-content';
import { classifyMotive, readMotiveReceipt, type MotiveSource } from './motiveClassifier';
import { hashSeed } from '../naming/workNames';
import { resolveToParentLocation } from '../sublocationShape';
import { emitTrace } from '../traceBuffer';

export type { EncounterStakes, StakesContext } from '../../types/encounterStakes';

// ─── Constants (NFP #1) ───────────────────────────────────────────

/** Stand-in for an actor with no resolvable name, at the start of a sentence. */
export const STAKES_ACTOR_FALLBACK = 'The mortal';

/**
 * Receipt contribution kinds that name an errand — the `{mission}` a mission lead
 * prints. Same set the THR-972 intro line read, moved here with it.
 */
const STAKES_MISSION_KINDS: ReadonlySet<string> = new Set([
  'ambition',
  'chain',
  'reputation',
  'bond',
]);

// ─── Types ────────────────────────────────────────────────────────

export type StakesFallbackReason = EncounterStakesLineTrace['fallback'];

export interface StakesLineResult {
  /** The assembled opening line (unenriched; callers pass it through `enrichProse`). */
  readonly text: string;
  /** Which lead the line opened with; `'none'` when it has none. */
  readonly leadSource: MotiveSource | 'none';
  /** Why the line is not the full formula, when it is not. */
  readonly fallback: StakesFallbackReason;
}

// ─── Context (engine-side, stamped once) ──────────────────────────

/**
 * The named errand behind a `mission`-classified motive.
 *
 * Reads the heaviest mission-kind contribution's provenance node. Fail-soft at
 * every hop: no receipt, no mission contribution, no node id, or a node the graph
 * has since culled all yield `undefined`, and the mission lead is dropped.
 */
export function missionNameFor(
  graph: WorldGraph,
  receipt: ReturnType<typeof readMotiveReceipt>,
): string | undefined {
  const contributions = receipt?.contributions;
  if (!contributions || contributions.length === 0) return undefined;

  let best: { weight: number; nodeId: string } | undefined;
  for (const c of contributions) {
    if (!STAKES_MISSION_KINDS.has(c.kind)) continue;
    const nodeId = c.provenance?.nodeId;
    if (!nodeId) continue;
    if (!best || c.weight > best.weight) best = { weight: c.weight, nodeId };
  }
  if (!best) return undefined;

  const name = graph.getNode(best.nodeId)?.name;
  return name && name.length > 0 ? name : undefined;
}

/**
 * The place the `chance` lead names: the action's target if it is a place,
 * else where the target stands, else where the actor stands — always lifted to
 * the location tier, so the lead names a settlement or site rather than a room.
 */
function resolveStakesLocation(
  graph: WorldGraph,
  action: Pick<UnifiedAction, 'actorId' | 'targetId'>,
): { id: string; name: string } | undefined {
  const toPlace = (nodeId: string | undefined) => {
    if (!nodeId) return undefined;
    const node = graph.getNode(nodeId);
    if (!node) return undefined;
    if (node.type === 'location' || (node.type as string) === 'sublocation') return node;
    const edge = graph
      .getAllEdgesForNode(nodeId)
      .find(e => e.type === 'located_at' && e.source === nodeId);
    return edge ? graph.getNode(edge.target) : undefined;
  };

  const place = toPlace(action.targetId) ?? toPlace(action.actorId);
  const location = resolveToParentLocation(graph, place) ?? place;
  if (!location?.name) return undefined;
  return { id: location.id, name: location.name };
}

/**
 * Build the stakes context for an action from the graph as it stands now.
 * Pure read; used by the stamp and, fail-open, by readers of an unstamped action.
 */
export function buildStakesContext(
  action: Pick<UnifiedAction, 'actorId' | 'targetId' | 'source'>,
  graph: WorldGraph,
): StakesContext {
  try {
    const receipt = readMotiveReceipt(graph.getNode(action.actorId)?.properties);
    const motiveSource = classifyMotive(receipt, { playerSourced: action.source === 'player' });
    const missionName = motiveSource === 'mission' ? missionNameFor(graph, receipt) : undefined;
    const location = resolveStakesLocation(graph, action);
    return {
      motiveSource,
      ...(missionName ? { missionName } : {}),
      ...(location ? { locationId: location.id, locationName: location.name } : {}),
    };
  } catch {
    return { motiveSource: null };
  }
}

/** The action's frozen context, or a fresh read when it was never stamped (old save). */
export function stakesContextFor(action: UnifiedAction, graph: WorldGraph): StakesContext {
  return action.stakesContext ?? buildStakesContext(action, graph);
}

// ─── Opening line ─────────────────────────────────────────────────

function capitalizeFirst(text: string): string {
  return text.length > 0 ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function actorOrFallback(actorName: string | undefined): string {
  return actorName && actorName.trim().length > 0 ? actorName : STAKES_ACTOR_FALLBACK;
}

/**
 * Pick and fill the lead clause. Returns the reason it was dropped when it was —
 * a lead with an unfillable token is dropped whole rather than printed raw.
 */
function buildLead(
  ctx: StakesContext,
  seedKey: string,
): { lead: string | null; fallback: StakesFallbackReason } {
  const source = ctx.motiveSource;
  if (!source) return { lead: null, fallback: null };
  const variants = STAKES_LEAD_VARIANTS[source] ?? [];
  if (variants.length === 0) return { lead: null, fallback: null };

  const template = variants[hashSeed(seedKey) % variants.length];
  const values: Record<string, string | undefined> = {
    mission: ctx.missionName,
    location: ctx.locationName,
  };
  let missing: StakesFallbackReason = null;
  const lead = template.replace(/\{(\w+)\}/g, (whole, key: string) => {
    const value = values[key];
    if (value && value.length > 0) return value;
    missing = missing ?? (key === 'mission' ? 'no_mission_name' : key === 'location' ? 'no_location' : missing);
    return whole;
  });
  if (/\{\w+\}/.test(lead)) return { lead: null, fallback: missing };
  return { lead, fallback: null };
}

/**
 * The opening stakes line: `[lead] [actor] must [goal] — or [risk].`
 *
 * `seedKey` is the action id (the variant pick hashes it). Over
 * {@link STAKES_LINE_MAX_CHARS} the lead is dropped; the line is never cut mid-word.
 */
export function buildStakesLine(
  stakes: EncounterStakes,
  actorName: string | undefined,
  ctx: StakesContext,
  seedKey: string,
): StakesLineResult {
  const actor = actorOrFallback(actorName);
  const core = `${actor} must ${stakes.goal} — or ${stakes.risk}.`;
  const { lead, fallback } = buildLead(ctx, seedKey);

  if (!lead) {
    return { text: capitalizeFirst(core), leadSource: 'none', fallback };
  }
  const full = `${lead} ${core}`;
  if (full.length > STAKES_LINE_MAX_CHARS) {
    return { text: capitalizeFirst(core), leadSource: 'none', fallback: 'over_length_lead_dropped' };
  }
  return { text: capitalizeFirst(full), leadSource: ctx.motiveSource ?? 'none', fallback: null };
}

// ─── Result line ──────────────────────────────────────────────────

/**
 * The fork arm the encounter ran on, as a `variants` key — the same resolution
 * `resolveStepDefinition` uses (the choice recorded at the branch's
 * `branchOnStep`). A `fallback` arm that is one of the variants reports that
 * variant's key, so authors key `arms` by the names in the file. Returns
 * `undefined` for a template with no fork.
 */
export function resolveStakesArmKey(
  template: Pick<UnifiedActionTemplate, 'steps'>,
  choiceHistory: readonly EncounterChoiceMemory[] | undefined,
): string | undefined {
  const branch = (template.steps ?? []).find(isActionStepBranch);
  if (!branch) return undefined;
  const choice = choiceHistory?.find(c => c.stepIndex === branch.branchOnStep);
  if (choice && branch.variants[choice.choiceId]) return choice.choiceId;
  for (const [key, step] of Object.entries(branch.variants)) {
    if (step === branch.fallback) return key;
  }
  return 'fallback';
}

/** The endings to use for one arm: the arm's overrides layered on the top level. */
export function stakesEndingsFor(
  stakes: EncounterStakes,
  armKey: string | undefined,
): EncounterStakesEndings {
  const arm = armKey ? stakes.arms?.[armKey] : undefined;
  return {
    won: arm?.won ?? stakes.won,
    lost: arm?.lost ?? stakes.lost,
    lostBadly: arm?.lostBadly ?? arm?.lost ?? stakes.lostBadly ?? stakes.lost,
  };
}

/** The result line for a finished encounter, chosen by outcome band. */
export function buildResultLine(
  stakes: EncounterStakes,
  actorName: string | undefined,
  band: StakesResultBand,
  armKey?: string,
): string {
  const endings = stakesEndingsFor(stakes, armKey);
  const form = STAKES_RESULT_FORMS[band] ?? STAKES_RESULT_FORMS.failure;
  const values: Record<string, string> = {
    actor: actorOrFallback(actorName),
    won: endings.won,
    lost: endings.lost,
    lostBadly: endings.lostBadly ?? endings.lost,
  };
  return capitalizeFirst(form.replace(/\{(\w+)\}/g, (_whole, key: string) => values[key] ?? ''));
}

// ─── Per-action conveniences (the read sites) ─────────────────────

/** Opening line for a live action, or `null` when the template authors no stakes. */
export function stakesLineForAction(
  action: UnifiedAction,
  template: Pick<UnifiedActionTemplate, 'stakes'>,
  graph: WorldGraph,
  actorName?: string,
): StakesLineResult | null {
  if (!template.stakes) return null;
  return buildStakesLine(
    template.stakes,
    actorName ?? graph.getNode(action.actorId)?.name,
    stakesContextFor(action, graph),
    action.actionId,
  );
}

/**
 * The line a finished action is remembered by: the result line once it has an
 * outcome, the opening line while it does not (the ledger never guesses an
 * ending). `null` when the template authors no stakes.
 */
export function rememberedStakesLine(
  action: UnifiedAction,
  template: Pick<UnifiedActionTemplate, 'stakes' | 'steps'>,
  graph: WorldGraph,
  actorName?: string,
): string | null {
  if (!template.stakes) return null;
  const name = actorName ?? graph.getNode(action.actorId)?.name;
  if (action.resolved && action.outcome) {
    return buildResultLine(
      template.stakes,
      name,
      action.outcome,
      resolveStakesArmKey(template, action.choiceHistory),
    );
  }
  return stakesLineForAction(action, template, graph, name)?.text ?? null;
}

// ─── The stamp (tick path) ────────────────────────────────────────

/**
 * Freeze an encounter action's stakes context and trace the line it yields.
 * Returns the action unchanged when it is already stamped or resolved.
 *
 * `template` is optional: a non-encounter action is stamped silently (the field
 * is harmless there) and only encounter templates trace.
 */
export function stampStakesContext(
  action: UnifiedAction,
  graph: WorldGraph,
  tick: number,
  template?: Pick<UnifiedActionTemplate, 'id' | 'stakes' | 'description'>,
): UnifiedAction {
  if (action.resolved || action.stakesContext) return action;
  const stakesContext = buildStakesContext(action, graph);
  const stamped: UnifiedAction = { ...action, stakesContext };

  if (template) {
    try {
      const actorName = graph.getNode(action.actorId)?.name;
      const result = template.stakes
        ? buildStakesLine(template.stakes, actorName, stakesContext, action.actionId)
        : null;
      const trace: Omit<EncounterStakesLineTrace, 'id' | 'timestamp'> = {
        category: 'encounter.stakes_line',
        tick,
        agentId: action.actorId,
        actionId: action.actionId,
        templateId: template.id,
        leadSource: result?.leadSource ?? stakesContext.motiveSource ?? 'none',
        fallback: result ? result.fallback : 'no_stakes_description_used',
        line: result?.text ?? template.description ?? '',
        summary: result
          ? `stakes line: ${result.text}`
          : `stakes line: ${template.id} has no stakes — description used`,
      };
      emitTrace(trace);
    } catch {
      // Tracing must never cost the stamp (NFP #4).
    }
  }
  return stamped;
}

/**
 * Stamp every unresolved, unstamped action in the state. Returns `{}` when
 * nothing needed stamping, so the tick keeps the same array identity.
 *
 * `templateFor` returns the encounter template for an action, or `undefined`
 * for a non-encounter action (stamped, not traced).
 */
export function stampStakesContexts(
  state: GameState,
  templateFor: (templateId: string) => Pick<UnifiedActionTemplate, 'id' | 'stakes' | 'description'> | undefined,
): Partial<GameState> {
  const actions = state.unifiedActions ?? [];
  if (!actions.some(a => !a.resolved && !a.stakesContext)) return {};
  const next = actions.map(a =>
    a.resolved || a.stakesContext
      ? a
      : stampStakesContext(a, state.graph, state.tick, templateFor(a.templateId)),
  );
  return { unifiedActions: next };
}
