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
  StrategicTargetRule,
  BehaviorFamily,
  UndertakingAppointmentPayoff,
  UndertakingObjectTypeId,
  UndertakingVerb,
  UndertakingVerbVariant,
} from '../types/strategicAction';
import type { ReachDomain } from '../types/traits';
import type { ValuePair } from '../types/agent';
import type { ContentQuery } from '../types/contentQuery';
import { UNDERTAKING_OBJECT_TYPES, HARM_ON_DESTROY, type UndertakingObjectType } from './undertaking-objects';
import { UNDERTAKING_VERB_PROSE, UNDERTAKING_VERB_WORDS, UNDERTAKING_CELL_PHRASES } from './undertaking-verb-prose';
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
  HARM_ON_LOWER,
  UNDERTAKING_PROGRESS_PER_ADVANCE,
  UNDERTAKING_DEFAULT_TIER,
  HUNT_APPOINTMENT_DELAY_TICKS,
  HUNT_APPOINTMENT_PULL_MULT,
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

/** The base verb of a variant (`control:seize` → `control`, `change:lower` → `change`). */
export function baseVerbOf(variant: UndertakingVerbVariant): UndertakingVerb {
  const colon = variant.indexOf(':');
  return (colon === -1 ? variant : variant.slice(0, colon)) as UndertakingVerb;
}

/** The family a cell reports for role-fit and history, by the object it acts on. */
export const CELL_FAMILY_BY_TYPE: Readonly<Record<UndertakingObjectTypeId, BehaviorFamily>> = {
  area: 'merchant-expansion',
  location: 'builder-civic',
  place: 'builder-civic',
  route: 'merchant-expansion',
  // The plot is the underworld's work, not a courtier's (THR-1430).
  mortal: 'underworld-network',
  // THR-1560 — the martial family that already works companies and armies. It governs
  // tracking only: the hunt itself is `destroy`, where `COUNTER_PLAY_FAMILY` wins.
  monster: 'warlord-expansion',
  faction: 'court-political',
  company: 'warlord-expansion',
  army: 'warlord-expansion',
  network: 'court-political',
  companion: 'court-political',
  item: 'artist-crafter',
  power: 'artist-crafter',
  condition: 'court-political',
  agreement: 'court-political',
  standing: 'court-political',
};

/** Destroying, seizing and lowering read as the warlord's family whatever the object — the counter-play columns. */
const COUNTER_PLAY_FAMILY: BehaviorFamily = 'warlord-expansion';

/** The reaches a verb leans on, whatever the object. */
export const CELL_REACH_BY_VERB: Readonly<Record<UndertakingVerb, Partial<Record<ReachDomain, number>>>> = {
  create: { stone: 0.6, gold: 0.4 },
  change: { stone: 0.5, heart: 0.5 },
  use: { eye: 0.5, veil: 0.5 },
  control: { heart: 0.5, iron: 0.5 },
  destroy: { iron: 0.6, shadow: 0.4 },
  observe: { eye: 0.6, star: 0.4 },
};

/** Two value pairs per verb — the board's desire signal (`UNDERTAKING_MOTIVATION_MIN_ARITY`). */
export const CELL_MOTIVATIONS_BY_VERB: Readonly<Record<UndertakingVerb, readonly ValuePair[]>> = {
  create: ['preservation_transformation', 'tradition_novelty'],
  change: ['preservation_transformation', 'loyalty_ambition'],
  use: ['honesty_cunning', 'revelation_discretion'],
  control: ['loyalty_ambition', 'courage_prudence'],
  destroy: ['mercy_ruthlessness', 'courage_prudence'],
  observe: ['revelation_discretion', 'honesty_cunning'],
};

/**
 * Where a `create` cell is done (THR-1392 slice 3). The object does not exist yet, so
 * the target is the **site** — the Location a Place is built in, the far end a route
 * is opened to, the Location a new one is founded from, the mortal a mark is dug up
 * about — and the candidate carries the site as its handle. Mirrors the sites the
 * shipped found-style templates name. A create cell with no site rule targets the
 * actor (`self`): a masterwork, a company or an army is made where its maker stands.
 * Kinds with no create cell name `self` so the table stays total.
 */
export const CREATE_SITE_RULE: Readonly<Record<UndertakingObjectTypeId, StrategicTargetRule>> = {
  area: { type: 'self' },
  location: { type: 'location_subtype', subtypes: ['town', 'city', 'capital', 'hamlet', 'farmland'] },
  place: { type: 'location_subtype', subtypes: ['town', 'city', 'capital', 'hamlet'] },
  route: { type: 'location_subtype', subtypes: ['town', 'city', 'capital'] },
  // A mortal is never *made* by an undertaking — the kind has one cell and it is
  // `destroy`. `self` keeps the table total without claiming a create cell exists.
  mortal: { type: 'self' },
  // Nor is a beast (THR-1560): the class has observe and destroy, no create.
  monster: { type: 'self' },
  faction: { type: 'location_subtype', subtypes: ['town', 'city', 'capital'] },
  company: { type: 'location_subtype', subtypes: ['town', 'city', 'capital', 'camp', 'fort'] },
  army: { type: 'location_subtype', subtypes: ['town', 'city', 'capital', 'camp', 'fort', 'castle'] },
  network: { type: 'self' },
  companion: { type: 'self' },
  item: { type: 'self' },
  power: { type: 'self' },
  condition: { type: 'colocated_actor' },
  agreement: { type: 'colocated_actor' },
  standing: { type: 'self' },
};

/** @deprecated THR-1392 slice 4 — the verb is `create`; kept one release for callers cut before the rename. */
export const FOUND_SITE_RULE = CREATE_SITE_RULE;

/**
 * What a cell's completion stirs (THR-1497): the encounter family a finished work may
 * seed as its catalyst, by cell id. A bounded authored table — the THR-1438
 * `UNDERTAKING_CELL_PHRASES` pattern — read once at synthesis into `catalystQuery`,
 * and overridable per package (`UndertakingCellOverride.catalystQuery`).
 *
 * **Why a table on the cell and not the legacy pack arm.** THR-1488 activated
 * `catalystQuery` and migrated all 35 pack carriers, then measured that under
 * `UNDERTAKING_MODEL: 'cells'` a profile's `templateIds` are never walked — so the
 * field resolved correctly and no mortal on a default seed could reach it. Starting
 * the pack arm to reach a field would be running the dead model for one property.
 * The cell is what the live board walks, so the cell is where the catalyst lives.
 *
 * **Why a table and not the registry's verb semantic.** `UndertakingObjectType.verbs`
 * entries are graph-op functions — what the verb *does* to the object. A family is
 * content, not an op; putting it beside the op would make the registry name
 * encounter tags, which is a different registry's business.
 *
 * **The family is chosen for what the work disturbs**, never for who does it:
 * building in a settlement stirs the Builders' Fellowship whether a zealot or a
 * merchant laid the stone; a blockade is the merchants' problem whoever raised it.
 * Every family named here is a live tag from the seventeen THR-1488 seated (each one a
 * game word the withered-seed narrative can print), and each resolves to at least one
 * individual-performable settlement-accepting template, because the seeding site's
 * eligibility filter runs after the query and a family with no such member seeds
 * nothing. `check:undertaking`'s `catalysts` block is fatal on an empty query; the
 * eligibility half is asserted in `undertakingCellCatalysts.test.ts`.
 *
 * A cell with no row seeds nothing on completion, which is right for most of them —
 * a scouted army or a called-in favour is not a work whose wake a guild answers.
 * Frequency is `STRATEGIC_CATALYST_SEED_CHANCE`; pacing is
 * `STRATEGIC_CATALYST_SEED_DELAY_TICKS`.
 */
export const UNDERTAKING_CELL_CATALYSTS: Readonly<Record<string, ContentQuery>> = {
  // Stone laid in a settlement — a Place built, a settlement founded or raised — is
  // the Builders' Fellowship's business, and their errands are what the wake offers.
  'cell.create.place': { kind: 'encounter_template', tags: ['#fellowship_errand'] },
  'cell.create.location': { kind: 'encounter_template', tags: ['#fellowship_errand'] },
  'cell.change_raise.location': { kind: 'encounter_template', tags: ['#fellowship_errand'] },
  // A lane opened, widened or choked is the Consortium's — a blockade most of all,
  // since the merchants are who it disturbs whoever raised it.
  'cell.create.route': { kind: 'encounter_template', tags: ['#consortium_errand'] },
  'cell.change_raise.route': { kind: 'encounter_template', tags: ['#consortium_errand'] },
  'cell.change_lower.route': { kind: 'encounter_template', tags: ['#consortium_errand'] },
  // An army raised or reinforced draws the Company's recruiters and contracts.
  'cell.create.army': { kind: 'encounter_template', tags: ['#company_errand'] },
  'cell.change_raise.army': { kind: 'encounter_template', tags: ['#company_errand'] },
  // A masterwork made brings the next commission to the maker's door.
  'cell.create.item': { kind: 'encounter_template', tags: ['#craft_commission'] },
  // A ring founded is the Thieves' Guild's competition, and they come calling.
  'cell.create.network': { kind: 'encounter_template', tags: ['#thieves_errand'] },
  // A settlement razed is the Watch's — the wake of a ruin is a patrol and an inquiry.
  'cell.destroy.location': { kind: 'encounter_template', tags: ['#watch_errand'] },
};

/**
 * A work whose payoff is a meeting (THR-1519, slice 3 of THR-1479) — the appointment
 * a finished cell arranges, by cell id. The `UNDERTAKING_CELL_CATALYSTS` pattern: a
 * bounded authored table read once at synthesis into `appointmentPayoff`, overridable
 * per package. Unlike the catalyst there is no chance roll — the meeting is the work's
 * product, not its wake — and the seed is an *appointment*: placed at the work's site,
 * due `delayTicks` after completion, kept or missed under slice 1's rule.
 *
 * **Why `create × Agreement` and only it, for now.** Digging up a secret is done
 * *about somebody* — the cell's site rule is `colocated_actor`, so the work's site is
 * a mortal, and a mortal is the one object a meeting can be with. The counterparty is
 * that mortal, the place is where they stand when the work finishes, and the promise
 * is the digger's: *I will be there*. Ruling 2 (*only encounters mint appointments
 * for now*) means *not the god*; the ticket's own connectivity table asks for this
 * cell, so it is in scope.
 *
 * **Both families are chosen for coverage first.** The kept branch is judged at the
 * place (`resolutionLocationId`), so its family must have an individual-performable
 * member for every settlement tier a mortal can stand at — `#thieves_errand` is the
 * one leverage-economy family with a `hamlet`-accepting member. The missed branch
 * fires wherever the mortal is; `#court_errand` (*a favour asked by someone who does
 * not ask*) is what a stood-up subject sends, and its members accept `town` through
 * `capital`; at a hamlet it withers, which is today's placeless fail-soft.
 * `undertakingCellAppointments.test.ts` asserts the coverage rather than assuming it.
 *
 * `use × Agreement:appointment` is declined by the plan — keeping an appointment is a
 * journey the decision phase makes, not a work at a site with checkpoints.
 */
export const UNDERTAKING_CELL_APPOINTMENTS: Readonly<Record<string, UndertakingAppointmentPayoff>> = {
  'cell.create.agreement': {
    meeting: { kind: 'encounter_template', tags: ['#thieves_errand'] },
    seedLabel: 'What was dug up wants talking about — a meeting, where the secret was found.',
    missed: {
      query: { kind: 'encounter_template', tags: ['#court_errand'] },
      seedLabel: 'The one who was not met sends someone who does not ask.',
    },
  },
  // THR-1560 — the hunt's payoff is the confront, planted at the den and judged there.
  // The kept branch is the one template tagged `#lair_confront` (`fight.lair.confront`),
  // aimed at the beast (`inheritSiteAsTarget`); the missed branch is the one tagged
  // `#hunt_trail_cold`, fired wherever the hunter stands. The confront never fires
  // placeless (`requirePlace`), and the travel budget is the hunt's own: far beasts are
  // exactly the case the monster scan cap exists for.
  'cell.destroy.monster': {
    delayTicks: HUNT_APPOINTMENT_DELAY_TICKS,
    meeting: { kind: 'encounter_template', tags: ['#lair_confront'] },
    seedLabel: 'A beast to face, at its den.',
    missed: {
      query: { kind: 'encounter_template', tags: ['#hunt_trail_cold'] },
      seedLabel: 'The trail went cold.',
    },
    inheritSiteAsTarget: true,
    pullMult: HUNT_APPOINTMENT_PULL_MULT,
    requirePlace: true,
    // A lair sits off the road graph; the hunter walks there by hex, so price it so.
    pricedByHex: true,
  },
};

/** "an attachment", "a room" — the display name is a player word (UI Law 14). */
function withArticle(noun: string): string {
  return `${/^[aeiou]/i.test(noun) ? 'an' : 'a'} ${noun}`;
}

function executionModeOf(type: UndertakingObjectType, variant: UndertakingVerbVariant): StrategicExecutionMode {
  const entry = type.verbs[variant];
  if (entry && typeof entry !== 'function') return entry.mode;
  return UNDERTAKING_VERB_DURATION[variant][UNDERTAKING_DEFAULT_TIER - 1] === 0 ? 'instant' : 'multi_tick_project';
}

function synthesiseCell(type: UndertakingObjectType, variant: UndertakingVerbVariant): StrategicActionTemplate {
  const verb = baseVerbOf(variant);
  const tierIndex = UNDERTAKING_DEFAULT_TIER - 1;
  const gated = MOTIVE_GATED_VERBS.includes(variant);
  const counterPlay = variant === 'destroy' || variant === 'control:seize' || variant === 'change:lower';
  const executionMode = executionModeOf(type, variant);
  const prose = UNDERTAKING_VERB_PROSE[variant];
  return {
    id: cellTemplateId(variant, type.id),
    // THR-1438: a cell may name itself in the game's own words (a mutiny, a coup, a
    // candidacy) where the generic "<Verb> <a kind>" misreads. Bounded table; a cell
    // with no entry takes the generic phrase, which is right for most of them.
    displayName: UNDERTAKING_CELL_PHRASES[cellTemplateId(variant, type.id)]
      ?? `${UNDERTAKING_VERB_WORDS[variant]} ${withArticle(type.displayName.toLowerCase())}`,
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
    targetRule: variant === 'create'
      ? CREATE_SITE_RULE[type.id]
      // THR-1438: a type may override the variant's default ownership rule. Read once,
      // here, so the template's declared rule *is* the effective one — the candidate
      // walk, the codex card and the resolver then all read the same number instead of
      // three copies that could drift.
      : { type: 'object', objectTypeId: type.id, ownership: type.ownershipOverride?.[variant] ?? OWNERSHIP_BY_VERB[variant] },
    motiveGate: gated ? [...MOTIVE_GATE_KINDS] : undefined,
    harmClass: variant === 'destroy' ? HARM_ON_DESTROY[type.id] : variant === 'control:seize' ? HARM_ON_SEIZE : variant === 'change:lower' ? HARM_ON_LOWER : undefined,
    // THR-1560: the harm lands later (a hunt only plants the confront), so completion
    // writes no outcome node and satisfies no grievance.
    ...(type.deferredPayoffVerbs?.includes(variant) ? { deferredPayoff: true } : {}),
    // THR-1497: the family this cell's completion stirs, when the table names one.
    catalystQuery: UNDERTAKING_CELL_CATALYSTS[cellTemplateId(variant, type.id)],
    // THR-1519: the meeting this cell's completion arranges, when the table names one.
    appointmentPayoff: UNDERTAKING_CELL_APPOINTMENTS[cellTemplateId(variant, type.id)],
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

// ─── Overrides ──────────────────────────────────────────────────────

/**
 * What a designer may put on a cell (THR-1392): the bounded authored surface. A
 * cell with no override is still a complete undertaking; an override is where taste
 * goes when a cell earns it. Anything not listed here is the cell's, not the author's.
 */
export interface UndertakingCellOverride {
  readonly displayName?: string;
  readonly activityProse?: readonly string[];
  readonly completionProse?: readonly string[];
  readonly cast?: StrategicActionTemplate['cast'];
  readonly creationEffects?: StrategicActionTemplate['creationEffects'];
  /** Pin the execution mode (an instant `use`, a project `survey`). */
  readonly executionMode?: StrategicExecutionMode;
  readonly projectDuration?: number;
  /** @deprecated THR-1488 — name the family with {@link catalystQuery}; a literal id list never resolved. */
  readonly catalystEncounterIds?: readonly string[];
  /** The family this override's completion stirs, replacing the cell's own row (THR-1497). */
  readonly catalystQuery?: ContentQuery;
  /** The meeting this override's completion arranges, replacing the cell's own row (THR-1519). */
  readonly appointmentPayoff?: UndertakingAppointmentPayoff;
  readonly reachProfile?: Partial<Record<ReachDomain, number>>;
}

/** The id a compiled override takes: the cell's id plus the package slug. */
export function cellOverrideId(cellId: string, slug: string): string {
  return `${cellId}.${slug}`;
}

/**
 * A cell with an authored override applied — a new template that keeps the cell's
 * verb, object type, target rule, gate, harm and tables, and replaces only the
 * fields the override names. Throws on an unknown cell: an override of nothing is
 * an authoring error the compiler must surface, never a template that silently
 * became a cell.
 */
export function applyCellOverride(cellId: string, slug: string, override: UndertakingCellOverride): StrategicActionTemplate {
  const base = getCellTemplate(cellId);
  if (!base) throw new Error(`applyCellOverride: '${cellId}' is not a cell`);
  const executionMode = override.executionMode ?? base.executionMode;
  return {
    ...base,
    id: cellOverrideId(cellId, slug),
    baseCellId: cellId,
    displayName: override.displayName ?? base.displayName,
    activityProse: override.activityProse ?? base.activityProse,
    completionProse: override.completionProse ?? base.completionProse,
    cast: override.cast ?? base.cast,
    creationEffects: override.creationEffects ?? base.creationEffects,
    executionMode,
    projectDuration: override.projectDuration ?? (executionMode === 'multi_tick_project' ? base.projectDuration : undefined),
    catalystEncounterIds: override.catalystEncounterIds ?? base.catalystEncounterIds,
    catalystQuery: override.catalystQuery ?? base.catalystQuery,
    appointmentPayoff: override.appointmentPayoff ?? base.appointmentPayoff,
    reachProfile: override.reachProfile ?? base.reachProfile,
  };
}
