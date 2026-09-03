/**
 * Undertaking cells — verb × object type, derived (THR-1392 slice 2).
 *
 * A cell is a `StrategicActionTemplate` **synthesised** from the object-type
 * registry: one per (verb variant, object type) the type declares a semantic for.
 * Nothing here is authored per cell — the verb tables give it difficulty, payoff
 * and length by tier, the verb line-sets give it prose with slots, the registry
 * gives it the target rule (`object`, under the variant's ownership rule), the
 * motive gate and the harm class. A cell with no override is a complete undertaking.
 *
 * `control` is two cells, `control:claim` and `control:seize`, because they differ
 * in exactly the things a template carries: the claim cell targets the unheld and
 * has no gate; the seize cell targets another's, is motive-gated and does a
 * `holding_seized` harm. Both dispatch the `control` verb; the resolver re-reads
 * ownership at completion and the two agree by construction.
 *
 * Cells are resolvable by id at all times (`getCellTemplate`) so a project that
 * started under the `cells` model can always find its template; they are only
 * *walked* by candidate generation when `UNDERTAKING_MODEL === 'cells'` and an
 * ambition profile lists them in `cells`.
 */
import type {
  StrategicActionTemplate,
  StrategicExecutionMode,
  BehaviorFamily,
  UndertakingObjectTypeId,
  UndertakingVerb,
  UndertakingVerbVariant,
} from '../types/strategicAction';
import type { ReachDomain } from '../types/traits';
import type { ValuePair } from '../types/agent';
import { UNDERTAKING_OBJECT_TYPES, HARM_ON_UNDO, type UndertakingObjectType } from './undertaking-objects';
import { UNDERTAKING_VERB_PROSE, UNDERTAKING_VERB_WORDS } from './undertaking-verb-prose';
import {
  UNDERTAKING_VERB_VARIANTS,
  STRATEGIC_VERB_OF_UNDERTAKING_VERB,
  UNDERTAKING_VERB_DIFFICULTY,
  UNDERTAKING_VERB_PAYOFF,
  UNDERTAKING_VERB_DURATION,
  OWNERSHIP_BY_VERB,
  MOTIVE_GATED_VERBS,
  MOTIVE_GATE_KINDS,
  HARM_ON_SEIZE,
  UNDERTAKING_PROGRESS_PER_ADVANCE,
  UNDERTAKING_DEFAULT_TIER,
} from './strategic-action-constants';

/** `cell.<variant>.<type>` — the variant with its colon folded to an underscore so the id stays a plain token. */
export const CELL_TEMPLATE_ID_PREFIX = 'cell.';

export function variantKey(variant: UndertakingVerbVariant): string {
  return variant.replace(':', '_');
}

export function cellTemplateId(variant: UndertakingVerbVariant, objectTypeId: UndertakingObjectTypeId): string {
  return `${CELL_TEMPLATE_ID_PREFIX}${variantKey(variant)}.${objectTypeId}`;
}

export function isCellTemplateId(id: string): boolean {
  return id.startsWith(CELL_TEMPLATE_ID_PREFIX);
}

/** The base verb of a variant (`control:seize` → `control`). */
export function baseVerbOf(variant: UndertakingVerbVariant): UndertakingVerb {
  return variant.startsWith('control') ? 'control' : (variant as UndertakingVerb);
}

/** The family a cell reports for role-fit and history, by the object it acts on. */
export const CELL_FAMILY_BY_TYPE: Readonly<Record<UndertakingObjectTypeId, BehaviorFamily>> = {
  attachment: 'artist-crafter',
  room: 'builder-civic',
  settlement: 'builder-civic',
  route: 'merchant-expansion',
  company: 'warlord-expansion',
  faction: 'court-political',
  mark: 'court-political',
};

/** Undoing and seizing read as the warlord's family whatever the object — the counter-play column. */
const COUNTER_PLAY_FAMILY: BehaviorFamily = 'warlord-expansion';

/** The reaches a verb leans on, whatever the object. */
export const CELL_REACH_BY_VERB: Readonly<Record<UndertakingVerb, Partial<Record<ReachDomain, number>>>> = {
  found: { stone: 0.6, gold: 0.4 },
  improve: { stone: 0.5, heart: 0.5 },
  use: { eye: 0.5, veil: 0.5 },
  control: { heart: 0.5, iron: 0.5 },
  undo: { iron: 0.6, shadow: 0.4 },
  survey: { eye: 0.6, star: 0.4 },
};

/** Two value pairs per verb — the board's desire signal (`UNDERTAKING_MOTIVATION_MIN_ARITY`). */
export const CELL_MOTIVATIONS_BY_VERB: Readonly<Record<UndertakingVerb, readonly ValuePair[]>> = {
  found: ['preservation_transformation', 'tradition_novelty'],
  improve: ['preservation_transformation', 'loyalty_ambition'],
  use: ['honesty_cunning', 'revelation_discretion'],
  control: ['loyalty_ambition', 'courage_prudence'],
  undo: ['mercy_ruthlessness', 'courage_prudence'],
  survey: ['revelation_discretion', 'honesty_cunning'],
};

function executionModeOf(type: UndertakingObjectType, variant: UndertakingVerbVariant): StrategicExecutionMode {
  const entry = type.verbs[variant];
  if (entry && typeof entry !== 'function') return entry.mode;
  return UNDERTAKING_VERB_DURATION[variant][UNDERTAKING_DEFAULT_TIER - 1] === 0 ? 'instant' : 'multi_tick_project';
}

function synthesiseCell(type: UndertakingObjectType, variant: UndertakingVerbVariant): StrategicActionTemplate {
  const verb = baseVerbOf(variant);
  const tierIndex = UNDERTAKING_DEFAULT_TIER - 1;
  const gated = MOTIVE_GATED_VERBS.includes(variant);
  const counterPlay = variant === 'undo' || variant === 'control:seize';
  const executionMode = executionModeOf(type, variant);
  const prose = UNDERTAKING_VERB_PROSE[variant];
  return {
    id: cellTemplateId(variant, type.id),
    displayName: `${UNDERTAKING_VERB_WORDS[variant]} a ${type.displayName.toLowerCase()}`,
    verb: STRATEGIC_VERB_OF_UNDERTAKING_VERB[verb],
    undertakingVerb: verb,
    cellVariant: variant,
    objectTypeId: type.id,
    executionMode,
    behaviorFamily: counterPlay ? COUNTER_PLAY_FAMILY : CELL_FAMILY_BY_TYPE[type.id],
    reachProfile: CELL_REACH_BY_VERB[verb],
    projectDuration: executionMode === 'multi_tick_project'
      ? UNDERTAKING_VERB_DURATION[variant][tierIndex] * UNDERTAKING_PROGRESS_PER_ADVANCE
      : undefined,
    checkpointDifficulty: UNDERTAKING_VERB_DIFFICULTY[variant][tierIndex],
    payoffValue: UNDERTAKING_VERB_PAYOFF[variant][tierIndex],
    motivations: CELL_MOTIVATIONS_BY_VERB[verb],
    activityProse: prose.activity,
    completionProse: prose.completion,
    targetRule: { type: 'object', objectTypeId: type.id, ownership: OWNERSHIP_BY_VERB[variant] },
    motiveGate: gated ? [...MOTIVE_GATE_KINDS] : undefined,
    harmClass: variant === 'undo' ? HARM_ON_UNDO[type.id] : variant === 'control:seize' ? HARM_ON_SEIZE : undefined,
    // A cell's mutation is the resolver's, never a hint; declared so the legacy
    // instant path, if ever reached with the flag off, does nothing rather than guess.
    mutationHint: { type: 'no_mutation' },
  } as StrategicActionTemplate;
}

/** Every cell the registry can complete: one per declared (variant, type). */
export const UNDERTAKING_CELL_TEMPLATES: readonly StrategicActionTemplate[] = UNDERTAKING_OBJECT_TYPES.flatMap(type =>
  UNDERTAKING_VERB_VARIANTS
    .filter(variant => type.verbs[variant] !== undefined)
    .map(variant => synthesiseCell(type, variant)),
);

const CELL_REGISTRY = new Map(UNDERTAKING_CELL_TEMPLATES.map(t => [t.id, t]));

export function getCellTemplate(id: string): StrategicActionTemplate | undefined {
  return CELL_REGISTRY.get(id);
}

export function cellsOfType(objectTypeId: UndertakingObjectTypeId): readonly StrategicActionTemplate[] {
  return UNDERTAKING_CELL_TEMPLATES.filter(t => t.objectTypeId === objectTypeId);
}
