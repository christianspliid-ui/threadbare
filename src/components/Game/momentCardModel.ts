/**
 * The moment card's read-model (THR-1299 slice 3).
 *
 * Pure: takes the game state and one `UndertakingMomentRecord`, returns
 * everything `MomentCard` renders. Kept out of the component so the words, the
 * chips and the action-slot gating are testable without a DOM — and so the
 * card cannot compute anything of its own (Law 27: presentation logic lives in
 * one place).
 *
 * ## Chips claim only state (Law 56)
 *
 * Every chip below is backed by a write the engine actually made on the
 * `StrategicProjectRuntime` or the graph — progress moved, halts accrued, status
 * changed, a binding released, a rider consumed, a drive minted. The prose lines
 * carry the scene; a chip that named something the engine did not write would
 * be a released defect, so nothing here is derived from the prose.
 *
 * ## Provenance, both directions (review S5, THR-1282 §6)
 *
 * Backward: `divineInfluence` on the record names the god's own rider on the
 * checkpoint this moment came from. It renders unlinked — the shipped rider flags
 * carry no action id, and a chip that clicks through to nothing is a dead link
 * that looks live (Law 17). Forward: the outcome node the lifecycle wrote for this
 * project at this tick (`evt_und_<projectId>_<tick>`, THR-1298) is looked up by
 * id, and any `pursues` edge on its victim carrying that node as
 * `mintedByEventId` is the drive this moment set in motion. Absent on every
 * moment that minted nothing, which is most of them.
 */

import type { GameState } from '../../types/gameState';
import type { WorldGraph } from '../../engine/graph';
import type { SphereName } from '../../types';
import type { StrategicProjectRuntime, UndertakingMomentRecord } from '../../types/strategicAction';
import type { EntityVisualKind } from '../../data/entity-visual-fallbacks';
import {
  UNDERTAKING_PROGRESS_PER_ADVANCE,
} from '../../data/strategic-action-constants';
import { getUndertakingProgressWord } from '../../data/domain-words';
import { stepOutcomeToOutcomeBand, stepOutcomeWord } from '../../data/outcome-band-content';
import {
  MOMENT_DIVINE_ACTIONS,
  renderMomentLine,
  selectMomentCardTemplate,
  type MomentDivineVerb,
} from '../../data/moment-card-content';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { canAfford } from '../../engine/influence';
import { UNDERTAKING_EVENT_NODE_ID_PREFIX } from '../../engine/grievance/undertakingOutcomeNode';

export type MomentChipTone = 'gain' | 'loss' | 'neutral' | 'divine';

export interface MomentCardChip {
  readonly id: string;
  /** The `CATEGORY` half — the kind of state that moved. */
  readonly category: string;
  /** The `noun` half — what, in words. */
  readonly noun: string;
  readonly tone: MomentChipTone;
  /** When the chip names an entity with a picture, its tile (the UI Law's image half). */
  readonly entity?: { id: string; kind: EntityVisualKind; name: string };
  /** When the chip's entity has a page, the agent it routes to (Law 21). */
  readonly selectAgentId?: string;
  /** Tooltip registry id for the concept word (Law 17). */
  readonly tooltipId?: string;
}

export interface MomentDivineAction {
  readonly templateId: string;
  readonly verb: MomentDivineVerb;
  readonly label: string;
  readonly confirm: string;
  readonly description: string;
  readonly sphere: SphereName | null;
  readonly essenceCost: number;
  readonly affordable: boolean;
}

export interface MomentForwardLink {
  readonly agentId: string;
  readonly agentName: string;
  readonly ambitionId: string;
  readonly ambitionName: string;
}

export interface MomentCardModel {
  readonly record: UndertakingMomentRecord;
  readonly title: string;
  readonly actorId: string;
  readonly actorName: string;
  /** Whether the actor still exists — a lost actor's card has no portrait to click. */
  readonly actorExists: boolean;
  readonly undertakingName: string;
  readonly opening: string;
  readonly consequence: string;
  /** Plain-register band word; null on a founding, which rolled nothing. */
  readonly bandWord: string | null;
  /** The outcome band the accent colour keys on; null on a founding. */
  readonly outcomeBand: string | null;
  /** Checkpoint position as a level — dots filled, no numerals; null when the runtime is gone. */
  readonly checkpoints: { total: number; filled: number } | null;
  readonly progressWord: string | null;
  readonly chips: readonly MomentCardChip[];
  readonly divineActions: readonly MomentDivineAction[];
  /** The action slot renders only while the work is still live and the mortal still stands. */
  readonly actionable: boolean;
  readonly forward: MomentForwardLink | null;
}

function findProject(state: GameState, projectId: string): StrategicProjectRuntime | undefined {
  return state.strategicState?.projects.find(p => p.projectId === projectId);
}

/**
 * The drive this moment minted, if any — read off the victim's `pursues` edges
 * rather than a whole-graph scan, because the outcome node names its victim.
 */
export function findForwardLink(
  graph: WorldGraph,
  record: UndertakingMomentRecord,
): MomentForwardLink | null {
  const eventNode = graph.getNode(`${UNDERTAKING_EVENT_NODE_ID_PREFIX}${record.projectId}_${record.tick}`);
  if (!eventNode) return null;
  const victimId = eventNode.properties?.victimAgentId as string | undefined;
  if (!victimId) return null;
  const edge = graph.getOutgoingEdges(victimId, 'pursues')
    .find(e => e.properties?.mintedByEventId === eventNode.id);
  if (!edge) return null;
  const victim = graph.getNode(victimId);
  const ambition = graph.getNode(edge.target);
  if (!victim || !ambition) return null;
  return {
    agentId: victimId,
    agentName: victim.name ?? victimId,
    ambitionId: ambition.id,
    ambitionName: ambition.name ?? ambition.id,
  };
}

function buildChips(
  record: UndertakingMomentRecord,
  project: StrategicProjectRuntime | undefined,
  forward: MomentForwardLink | null,
): MomentCardChip[] {
  const chips: MomentCardChip[] = [];

  // What the checkpoint did to the work — `progress`, `halts` and `status` are the
  // runtime writes behind each of these.
  switch (record.momentClass) {
    case 'started':
      chips.push({ id: 'work', category: 'Work', noun: 'begun', tone: 'neutral', tooltipId: 'ui.moment_checkpoints' });
      break;
    case 'completion':
      chips.push({ id: 'work', category: 'Work', noun: 'finished', tone: 'gain', tooltipId: 'ui.moment_checkpoints' });
      break;
    case 'abandoned':
      chips.push({ id: 'work', category: 'Work', noun: 'abandoned', tone: 'loss', tooltipId: 'ui.moment_checkpoints' });
      break;
    case 'fork':
      chips.push({ id: 'stakes', category: 'Stakes', noun: 'raised — the work resumes', tone: 'neutral', tooltipId: 'ui.moment_checkpoints' });
      break;
    case 'at_cost':
      chips.push({ id: 'progress', category: 'Progress', noun: 'a step, dearly bought', tone: 'loss', tooltipId: 'ui.moment_checkpoints' });
      break;
    case 'complication':
      chips.push({
        id: 'progress',
        category: 'Progress',
        noun: record.effect === 'halt' || record.effect === undefined ? 'halted' : 'a step, dearly bought',
        tone: 'loss',
        tooltipId: 'ui.moment_checkpoints',
      });
      break;
  }

  // The binder released a must-persist binding — the ledger write behind the name.
  if (record.lostCastName) {
    chips.push({ id: 'cast', category: 'Cast', noun: `lost ${record.lostCastName}`, tone: 'loss' });
  }

  // Backward provenance — the god's rider, consumed on this checkpoint.
  if (record.divineInfluence) {
    chips.push({
      id: 'divine',
      category: 'Your hand',
      noun: record.divineInfluence.verb === 'inspire' ? 'inspired this checkpoint' : 'sabotaged this checkpoint',
      tone: 'divine',
      tooltipId: 'ui.moment_divine_hand',
    });
  }

  // Forward provenance — the drive this outcome minted (THR-1298's write).
  if (forward) {
    chips.push({
      id: 'forward',
      category: 'Set in motion',
      noun: `${forward.agentName} now pursues ${forward.ambitionName}`,
      tone: 'neutral',
      entity: { id: forward.agentId, kind: 'agent', name: forward.agentName },
      selectAgentId: forward.agentId,
      tooltipId: 'ui.moment_set_in_motion',
    });
  }

  void project;
  return chips;
}

function buildDivineActions(state: GameState): MomentDivineAction[] {
  return MOMENT_DIVINE_ACTIONS.flatMap(entry => {
    const template = getUnifiedTemplateById(entry.templateId);
    if (!template) return [];
    const sphere = (template.sphereAffinity as SphereName | null | undefined) ?? null;
    const essenceCost = template.essenceCost ?? 0;
    return [{
      templateId: entry.templateId,
      verb: entry.verb,
      label: entry.label,
      confirm: entry.confirm,
      description: template.description ?? '',
      sphere,
      essenceCost,
      affordable: sphere ? canAfford(state.essencePool, sphere, essenceCost) : true,
    }];
  });
}

/** Build the card's read-model. Never throws — every missing input degrades to a plain field. */
export function buildMomentCardModel(state: GameState, record: UndertakingMomentRecord): MomentCardModel {
  const graph = state.graph;
  const project = findProject(state, record.projectId);
  const actorNode = graph.getNode(record.actorId);
  const actorName = actorNode?.name ?? record.actorId;
  const template = selectMomentCardTemplate(record.momentClass, record.lostCastName);
  const bandWord = record.band ? stepOutcomeWord(record.band) : null;
  const vars = {
    actor: actorName,
    undertaking: record.undertakingName,
    band: bandWord ?? undefined,
    lost: record.lostCastName,
  };

  const checkpoints = project
    ? (() => {
      const total = Math.max(1, Math.ceil(project.progressRequired / UNDERTAKING_PROGRESS_PER_ADVANCE));
      const filled = Math.min(total, Math.round(project.progress / UNDERTAKING_PROGRESS_PER_ADVANCE));
      return { total, filled };
    })()
    : null;
  // A finished work is not "nearly done" — the Work chip says finished, and the
  // progress band vocabulary tops out below completion by design.
  const progressWord = project && project.progressRequired > 0 && project.status === 'active'
    ? getUndertakingProgressWord((project.progress / project.progressRequired) * 100)
    : null;

  const forward = findForwardLink(graph, record);

  return {
    record,
    title: template.title,
    actorId: record.actorId,
    actorName,
    actorExists: !!actorNode,
    undertakingName: record.undertakingName,
    opening: renderMomentLine(template.opening, vars),
    consequence: renderMomentLine(template.consequence, vars),
    bandWord,
    outcomeBand: record.band ? stepOutcomeToOutcomeBand(record.band) : null,
    checkpoints,
    progressWord,
    chips: buildChips(record, project, forward),
    divineActions: buildDivineActions(state),
    actionable: !!project && project.status === 'active' && !!actorNode,
    forward,
  };
}
