/**
 * The Undertaking Contract — the undertaking factory's machine gate (THR-1300 slice 1).
 *
 * Plan: `Docs/plans/2026-09-02-thr-1300-undertaking-factory.md` § Stage 3. The
 * encounter line's `compositionContract.ts` is the sibling: same shape (blocks,
 * violations that name where the rule is written, a report the runner and the
 * Package View both read), different substrate. Pure and authoring-time — nothing
 * under `src/engine/**` imports this; it imports the engine's *data* (kind rows,
 * ambition templates) and the register detectors, and composes the validators that
 * already exist rather than restating them:
 *
 *   - kind membership and counter-play → `validateKindRegistry` (undertaking-kinds.ts)
 *   - board authoring                  → `findMotivationDefects` (lifted here from the
 *                                        motivations test, THR-1292)
 *   - register                          → `countVagueness` / `countSecondPerson`
 *                                        (nudgeAuditDetectors.ts), at the encounter standard
 *
 * A gate that re-implements one of those is a second rule that will drift. The
 * blocks are ordered structural-first, so a template missing its kind row is told
 * that before it is told about a weak sentence.
 *
 * **Law 56 on undertakings is the inverse of the encounter case** (plan § Notes):
 * chips are engine-derived, so chip backing holds by construction; the leak is prose
 * claiming state. The write-set rule (`creation`) is the gate; the lexicon half ships
 * at **warn** and is promoted on pilot evidence (THR-1224's bar: right most of the
 * time is a warning's bar, not a gate's).
 */

import type { StrategicActionTemplate, UndertakingKindRow } from '../../types/strategicAction';
import type { AmbitionTemplate } from '../../types/ambition';
import type { ValuePair } from '../../types/agent';
import { VALUE_PAIRS } from '../../types/agent';
import {
  getAllUndertakingKindRows,
  getUndertakingKindForTemplate,
  getUndertakingKindRow,
  validateKindRegistry,
} from '../undertaking-kinds';
import { MOTIVE_GATE_KINDS } from '../strategic-action-constants';
import {
  AMBITION_TEMPLATES,
  EVENT_MINTED_AMBITION_TEMPLATES,
  GRIEVANCE_AMBITION_TEMPLATES,
} from '../ambition-templates';
import { countSecondPerson, countVagueness } from './nudgeAuditDetectors';
import {
  UNDERTAKING_ACTIVITY_PROSE_MIN,
  UNDERTAKING_COMPLETION_PROSE_MIN,
  UNDERTAKING_CONSEQUENCE_CLAIM_NOUNS,
  UNDERTAKING_CONSEQUENCE_LEXICON,
  UNDERTAKING_MOTIVATION_MIN_ARITY,
  UNDERTAKING_TIER_DIFFICULTY_BANDS,
  UNDERTAKING_TIER_PAYOFF_BANDS,
} from './undertakingConstants';

// ─── Report shape ────────────────────────────────────────────────────

/** The blocks, in the order the runner reports them (structural first). */
export type UndertakingBlock =
  | 'identity'
  | 'kind_membership'
  | 'counter_play'
  | 'cast'
  | 'creation'
  | 'bands'
  | 'board'
  | 'reachability'
  | 'register'
  | 'tokens';

export const UNDERTAKING_BLOCKS: readonly UndertakingBlock[] = [
  'identity', 'kind_membership', 'counter_play', 'cast', 'creation',
  'bands', 'board', 'reachability', 'register', 'tokens',
];

export interface UndertakingViolation {
  readonly block: UndertakingBlock;
  readonly message: string;
  /** Where the rule is written down — the plan's Stage 3 row, so a reviewer can argue with it. */
  readonly rule: string;
}

export interface UndertakingReport {
  readonly templateId: string;
  readonly violations: readonly UndertakingViolation[];
  /** Advisory only — never affects `passed` (THR-1224). The Law 56 lexicon half lives here. */
  readonly warnings: readonly string[];
  readonly passed: boolean;
}

/**
 * Everything a single template's check needs that is not the template: the
 * registry, the whole corpus (for the registry-wide validation), and the set of
 * template ids some ambition's `strategicProfile` names. Built once per run.
 */
export interface UndertakingContractContext {
  readonly rows: readonly UndertakingKindRow[];
  readonly resolveTemplate: (id: string) => StrategicActionTemplate | undefined;
  /** Template ids reachable through at least one ambition's strategic profile. */
  readonly profiledTemplateIds: ReadonlySet<string>;
  /** Registry-wide problems, keyed by the template each names (computed once). */
  readonly registryProblemsByTemplate: ReadonlyMap<string, readonly string[]>;
}

const RULE = 'Docs/plans/2026-09-02-thr-1300-undertaking-factory.md § Stage 3';

// ─── Lifted validators ───────────────────────────────────────────────

export interface MotivationDefect {
  readonly id: string;
  readonly problem: string;
}

/**
 * Board-authoring defects on `motivations` — lifted verbatim from
 * `undertaking-motivations.test.ts` (THR-1292) so the test and the gate share one
 * rule. Silent (absent/empty), under the arity floor, duplicated, or naming a
 * non-`ValuePair` (which `computeDesireScore` reads as 0 forever).
 */
export function findMotivationDefects(
  templates: readonly { id: string; motivations?: readonly ValuePair[] }[],
  minArity: number = UNDERTAKING_MOTIVATION_MIN_ARITY,
): MotivationDefect[] {
  const defects: MotivationDefect[] = [];
  for (const t of templates) {
    const m = t.motivations;
    if (m === undefined || m.length === 0) {
      defects.push({ id: t.id, problem: 'silent' });
      continue;
    }
    if (m.length < minArity) {
      defects.push({ id: t.id, problem: `arity ${m.length} < ${minArity}` });
    }
    if (new Set(m).size !== m.length) {
      defects.push({ id: t.id, problem: 'duplicate pair' });
    }
    for (const pair of m) {
      if (!VALUE_PAIRS.includes(pair)) {
        defects.push({ id: t.id, problem: `not a ValuePair: ${pair}` });
      }
    }
  }
  return defects;
}

/** Template ids some ambition's strategic profile can offer — the third registration. */
export function profiledTemplateIds(
  ambitions: readonly AmbitionTemplate[] = [
    ...AMBITION_TEMPLATES,
    ...EVENT_MINTED_AMBITION_TEMPLATES,
    ...GRIEVANCE_AMBITION_TEMPLATES,
  ],
): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const a of ambitions) {
    for (const id of a.strategicProfile?.templateIds ?? []) ids.add(id);
  }
  return ids;
}

// ─── Context ─────────────────────────────────────────────────────────

export function buildUndertakingContractContext(
  templates: readonly StrategicActionTemplate[],
  opts: {
    rows?: readonly UndertakingKindRow[];
    ambitions?: readonly AmbitionTemplate[];
  } = {},
): UndertakingContractContext {
  const byId = new Map(templates.map(t => [t.id, t]));
  const rows = opts.rows ?? getAllUndertakingKindRows();
  const resolveTemplate = (id: string) => byId.get(id);
  const registryProblemsByTemplate = new Map<string, string[]>();
  for (const p of validateKindRegistry(rows, resolveTemplate)) {
    // Problems carry the template they are about when they are about one; a
    // row-level problem (an empty D column) is charged to every template in the
    // row, because each of them is the one that would leave the kind undoable.
    const targets = p.templateId
      ? [p.templateId]
      : rows.filter(r => r.kindId === p.kindId).flatMap(r => [...r.createTemplateIds, ...r.updateTemplateIds, ...r.destroyTemplateIds]);
    for (const id of targets) {
      const list = registryProblemsByTemplate.get(id) ?? [];
      list.push(`${p.code}: ${p.detail}`);
      registryProblemsByTemplate.set(id, list);
    }
  }
  return {
    rows,
    resolveTemplate,
    profiledTemplateIds: profiledTemplateIds(opts.ambitions),
    registryProblemsByTemplate,
  };
}

// ─── The blocks ──────────────────────────────────────────────────────

const ID_PREFIX = 'strategic_';

/** Target rules that can resolve to something ownable or commanded — everything but `self`. */
export const OWNABLE_TARGET_RULE_TYPES: ReadonlySet<string> = new Set([
  'location_subtype', 'any_location', 'actor_with_trait', 'faction', 'trade_route',
  'hex_region', 'sublocation_type', 'colocated_actor',
]);

/**
 * `{token}` names the strategic prose path resolves. `strategicPresentation.ts`
 * renders `activityProse[0]` verbatim and `ambitionTick` renders
 * `completionProse[0]` verbatim — neither substitutes anything — so the resolvable
 * set is **empty** and every brace token is a leak. Read off the renderer, as
 * `SIMPLE_TOKENS` was read off `enrichProse`; when a substitution chain is added
 * to that path this set is where it is declared.
 */
export const STRATEGIC_PROSE_TOKENS: ReadonlySet<string> = new Set<string>();

function rowFor(template: StrategicActionTemplate): UndertakingKindRow | undefined {
  const kind = getUndertakingKindForTemplate(template.id);
  return kind ? getUndertakingKindRow(kind) : undefined;
}

function kindColumnCount(template: StrategicActionTemplate, rows: readonly UndertakingKindRow[]): number {
  let n = 0;
  for (const r of rows) {
    for (const col of [r.createTemplateIds, r.updateTemplateIds, r.destroyTemplateIds]) {
      if (col.includes(template.id)) n++;
    }
  }
  return n;
}

export function checkUndertakingContract(
  template: StrategicActionTemplate,
  ctx: UndertakingContractContext,
): UndertakingReport {
  const v: UndertakingViolation[] = [];
  const warnings: string[] = [];
  const fail = (block: UndertakingBlock, message: string) => v.push({ block, message, rule: RULE });

  // ── Identity ──
  if (!template.id.startsWith(ID_PREFIX)) fail('identity', `id '${template.id}' lacks the '${ID_PREFIX}' prefix`);
  if (!template.displayName?.trim()) fail('identity', 'displayName is empty');
  else if (/\d/.test(template.displayName)) fail('identity', `displayName '${template.displayName}' carries a numeral — interactive text is words`);
  if (!template.verb) fail('identity', 'verb is missing');
  if (!template.executionMode) fail('identity', 'executionMode is missing');
  if (!template.behaviorFamily) fail('identity', 'behaviorFamily is missing');
  if (!template.reachProfile || Object.keys(template.reachProfile).length === 0) fail('identity', 'reachProfile is empty');

  // ── Kind membership ──
  const columns = kindColumnCount(template, ctx.rows);
  const isProject = template.executionMode === 'multi_tick_project';
  if (isProject) {
    if (columns === 0) fail('kind_membership', 'a multi_tick_project template is named in no kind row — until a kind can be undone it is not a kind, and a work outside every kind cannot be undone');
    else if (columns > 1) fail('kind_membership', `named in ${columns} kind columns; exactly one is the rule`);
  } else if (columns === 0 && !template.mutationHint) {
    fail('kind_membership', `a row-less ${template.executionMode} template carries no mutationHint — a verb that changes nothing is not a verb`);
  }

  // ── Counter-play ──
  if (template.verb === 'destroy') {
    const gate = template.motiveGate ?? [];
    if (gate.length === 0) fail('counter_play', 'a destroy verb carries no motiveGate');
    for (const m of gate) {
      if (!(MOTIVE_GATE_KINDS as readonly string[]).includes(m)) fail('counter_play', `motiveGate names '${m}', not a MOTIVE_GATE_KINDS member`);
    }
    if (!template.harmClass) fail('counter_play', 'a destroy verb carries no harmClass — the reactive loop cannot read a harm it is not told about');
    if (!OWNABLE_TARGET_RULE_TYPES.has(template.targetRule?.type)) {
      fail('counter_play', `targetRule '${template.targetRule?.type}' cannot resolve an ownable or commanded object — a destroy with no victim is the vacuous proof`);
    }
  }
  for (const p of ctx.registryProblemsByTemplate.get(template.id) ?? []) fail('counter_play', p);

  // ── Cast declarations ──
  if (isProject && (template.verb === 'create' || template.verb === 'change')) {
    const cast = template.cast ?? [];
    if (cast.length === 0) {
      fail('cast', 'a multi_tick create/update template declares no cast — scarcity and identity are the batch floors and this slot count is zero');
    }
    for (const slot of cast) {
      if (slot.persistence === 'must-persist') {
        if (!slot.mintRole) fail('cast', `cast slot '${slot.key}' is must-persist without a mintRole`);
        if (!slot.identityRequirement) fail('cast', `cast slot '${slot.key}' is must-persist without an identityRequirement`);
      } else if (slot.acceptedRoles !== undefined && slot.acceptedRoles.length === 0) {
        fail('cast', `cast slot '${slot.key}' declares an empty acceptedRoles — an any-role slot cannot be scarce`);
      }
    }
  }

  // ── Creation (the write-set non-vacuity rule, Law 56's inverse) ──
  if (template.verb === 'create') {
    const bands = template.creationEffects
      ? (['onAdvance', 'onAtCost', 'onCritFailure'] as const).filter(b => (template.creationEffects![b]?.length ?? 0) > 0).length
      : 0;
    if (bands === 0 && !template.mutationHint) {
      fail('creation', 'a create verb whose only product is prose — declare creationEffects for at least one band or a mutationHint producing the kind\'s object');
    }
  }

  // ── Band tables ──
  const row = rowFor(template);
  if (row) {
    const [dMin, dMax] = UNDERTAKING_TIER_DIFFICULTY_BANDS[row.tier];
    const [pMin, pMax] = UNDERTAKING_TIER_PAYOFF_BANDS[row.tier];
    if (typeof template.checkpointDifficulty === 'number' && (template.checkpointDifficulty < dMin || template.checkpointDifficulty > dMax)) {
      fail('bands', `checkpointDifficulty ${template.checkpointDifficulty} outside tier ${row.tier} band [${dMin}, ${dMax}]`);
    }
    if (typeof template.payoffValue === 'number' && (template.payoffValue < pMin || template.payoffValue > pMax)) {
      fail('bands', `payoffValue ${template.payoffValue} outside tier ${row.tier} band [${pMin}, ${pMax}]`);
    }
  }
  if (isProject && typeof template.projectDuration !== 'number') fail('bands', 'a multi_tick_project template sets no projectDuration');

  // ── Board authoring ──
  for (const d of findMotivationDefects([template])) fail('board', `motivations: ${d.problem}`);
  if (typeof template.payoffValue !== 'number') fail('board', 'payoffValue is absent — the one currency has nothing to rank');

  // ── Reachability ──
  if (!ctx.profiledTemplateIds.has(template.id)) {
    fail('reachability', 'no ambition template names this id in its strategicProfile.templateIds — the silent third registration');
  }

  // ── Register (outcome field class, the encounter standard) ──
  const prose = [...template.activityProse.map((s, i) => ({ s, where: `activityProse[${i}]` })), ...template.completionProse.map((s, i) => ({ s, where: `completionProse[${i}]` }))];
  if (template.activityProse.length < UNDERTAKING_ACTIVITY_PROSE_MIN) fail('register', `activityProse has ${template.activityProse.length} entries; ${UNDERTAKING_ACTIVITY_PROSE_MIN} is the floor`);
  if (template.completionProse.length < UNDERTAKING_COMPLETION_PROSE_MIN) fail('register', `completionProse has ${template.completionProse.length} entries; ${UNDERTAKING_COMPLETION_PROSE_MIN} is the floor`);
  for (const { s, where } of prose) {
    const vague = countVagueness(s, 'outcome');
    if (vague > 0) fail('register', `${where}: ${vague} evasive-vagueness term(s)`);
    const second = countSecondPerson(s);
    if (second > 0) fail('register', `${where}: ${second} second-person address(es)`);
    if (/\d/.test(s)) fail('register', `${where}: carries a numeral`);
    if (s.includes('!')) fail('register', `${where}: exclamation mark`);
    if (/\b(was|were|had|did)\b/i.test(s)) warnings.push(`${where}: past-tense marker — the doctrine narrates in the present`);
  }

  // ── Enrichment dry-run ──
  for (const { s, where } of prose) {
    for (const m of s.matchAll(/\{([^}]*)\}/gu)) {
      if (!STRATEGIC_PROSE_TOKENS.has(m[1])) fail('tokens', `${where}: {${m[1]}} is not a token the strategic prose path resolves`);
    }
  }

  // ── Law 56 write set — Half A, warn-level ──
  const lexicon = UNDERTAKING_CONSEQUENCE_LEXICON[row?.lexicon ?? 'default'] ?? [];
  for (const [i, s] of template.completionProse.entries()) {
    const lower = s.toLowerCase();
    for (const noun of UNDERTAKING_CONSEQUENCE_CLAIM_NOUNS) {
      if (new RegExp(`\\b${noun}s?\\b`).test(lower) && !lexicon.includes(noun)) {
        warnings.push(`completionProse[${i}]: names '${noun}', which is not in the ${row ? `'${row.lexicon}'` : 'default'} kind's write-set lexicon — prose claiming state the work does not write`);
      }
    }
  }

  return { templateId: template.id, violations: v, warnings, passed: v.length === 0 };
}

/** Blocks a report fails, in report order — what the runner and the test name. */
export function failedBlocks(report: UndertakingReport): readonly UndertakingBlock[] {
  const set = new Set(report.violations.map(x => x.block));
  return UNDERTAKING_BLOCKS.filter(b => set.has(b));
}
