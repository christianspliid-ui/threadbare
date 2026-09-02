/**
 * The Undertaking Package View's model — THR-1300 slice 4, the
 * `buildEncounterPackage.ts` sibling (THR-1046).
 *
 * One undertaking template, resolved into the blocks a reviewer reads: identity and
 * the calling its family maps to; the kind row and the cell this template fills, with
 * the row's other cells beside it; the board values **as words** (Law 13 — the
 * numeral stays in the file, the surface bands it); cast slots; creation effects per
 * band; the mutation and the object it makes; harm and motive gates; the authored
 * prose; the write set (Law 56's chip-backing list, literally); and the contract
 * verdict with its warn channel. Pure and authoring-time: it reads the registry and
 * the contract, never the graph.
 *
 * **Why a package beats a `?undertaking=` link:** a live run rolls one band and lands
 * on one target. The package shows every band's effects and every cell of the row at
 * once — including the ones no single run reaches, which are precisely the ones that
 * go unwritten.
 */
import { getAllStrategicTemplates } from '../../../engine/strategicActionCandidates';
import { difficultyWord } from '../../../engine/encounters/nudges';
import {
  getAllUndertakingKindRows,
  getUndertakingKindForTemplate,
  getUndertakingKindRow,
} from '../../../data/undertaking-kinds';
import {
  buildUndertakingContractContext,
  checkUndertakingContract,
  failedBlocks,
  undertakingWriteSet,
  type UndertakingContractContext,
  type UndertakingWriteSet,
} from '../../../data/content-eval/undertakingContract';
import { isUndertakingRetrofitPending } from '../../../data/content-eval/undertakingRetrofitPending';
import { UNDERTAKING_TIER_PAYOFF_BANDS } from '../../../data/content-eval/undertakingConstants';
import { HARM_MAGNITUDE_BY_CLASS } from '../../../data/ambition-minting-rules';
import type {
  StrategicActionTemplate,
  UndertakingCastSpec,
  UndertakingCreationEffect,
  UndertakingKindRow,
} from '../../../types/strategicAction';
import type { ReachDomain } from '../../../types/traits';

// ── Constants (NFP #1) ───────────────────────────────────────────────

/** Packages a batch route compares side by side — the encounter view's ceiling, reused. */
export const UNDERTAKING_PACKAGE_BATCH_MAX = 6;

/** Family → the calling word the surface shows beside it (UL: **calling**). */
export const CALLING_BY_FAMILY: Readonly<Record<string, string>> = {
  'merchant-expansion': 'the trader',
  'builder-civic': 'the builder',
  'scholar-seeker': 'the seeker',
  'zealot-mission': 'the zealot',
  'court-political': 'the courtier',
  'underworld-network': 'the fixer',
  'warlord-expansion': 'the warlord',
  'caretaker-steward': 'the steward',
  'artist-crafter': 'the maker',
  'wanderer-explorer': 'the wanderer',
};

/** `projectDuration` (checkpoints) → a word. Never the count (Law 13). */
export const DURATION_WORD_BANDS: readonly { readonly max: number; readonly word: string }[] = [
  { max: 4, word: 'brief' },
  { max: 8, word: 'sustained' },
  { max: 12, word: 'long' },
  { max: Number.POSITIVE_INFINITY, word: 'a great labour' },
];

/** Harm magnitude (`HARM_MAGNITUDE_BY_CLASS`) → a word. */
export const HARM_WORD_BANDS: readonly { readonly max: number; readonly word: string }[] = [
  { max: 0.3, word: 'slight' },
  { max: 0.6, word: 'grave' },
  { max: Number.POSITIVE_INFINITY, word: 'ruinous' },
];

export const CELL_LABEL: Readonly<Record<'create' | 'update' | 'destroy', string>> = {
  create: 'C — make',
  update: 'U — change',
  destroy: 'D — undo',
};

// ── Model ────────────────────────────────────────────────────────────

export type KindCell = 'create' | 'update' | 'destroy';

export interface PackageKindBlock {
  readonly row: UndertakingKindRow;
  readonly cell: KindCell;
  /** The row's other cells, so the counter-play is one click away (Law 21). */
  readonly siblings: Readonly<Record<KindCell, readonly string[]>>;
}

export interface PackageBoardBlock {
  readonly difficulty: string;
  readonly payoff: string;
  readonly duration: string;
  readonly motivations: readonly string[];
  readonly executionMode: string;
}

export interface PackageCreationBand {
  readonly band: 'onAdvance' | 'onAtCost' | 'onCritFailure';
  readonly label: string;
  readonly effects: readonly UndertakingCreationEffect[];
}

export interface PackageVerdict {
  readonly passed: boolean;
  readonly retrofitPending: boolean;
  readonly failedBlocks: readonly string[];
  readonly violations: readonly { readonly block: string; readonly message: string }[];
  readonly warnings: readonly string[];
}

export interface UndertakingPackage {
  readonly templateId: string;
  readonly displayName: string;
  readonly verb: string;
  readonly family: string;
  readonly calling: string;
  readonly primaryReach: string | undefined;
  /** Reach weights sorted strongest-first — shown as chips, never as numbers. */
  readonly reaches: readonly string[];
  readonly kind: PackageKindBlock | undefined;
  readonly board: PackageBoardBlock;
  readonly cast: readonly UndertakingCastSpec[];
  readonly creation: readonly PackageCreationBand[];
  readonly mutation: { readonly type: string; readonly detail: string } | undefined;
  readonly harm: { readonly harmClass: string; readonly magnitude: string } | undefined;
  readonly motiveGate: readonly string[];
  readonly catalysts: readonly string[];
  readonly prose: { readonly activity: readonly string[]; readonly completion: readonly string[] };
  readonly writeSet: UndertakingWriteSet;
  readonly verdict: PackageVerdict;
}

export interface UndertakingPackageIndexRow {
  readonly templateId: string;
  readonly displayName: string;
  readonly verb: string;
  readonly family: string;
  readonly primaryReach: string | undefined;
  readonly kindId: string | undefined;
  readonly cell: KindCell | undefined;
  readonly tier: 1 | 2 | 3 | undefined;
  readonly retrofitPending: boolean;
}

// ── Words (Law 13: the number stays in the file) ─────────────────────

function bandWord(value: number, bands: readonly { readonly max: number; readonly word: string }[]): string {
  for (const b of bands) if (value <= b.max) return b.word;
  return bands[bands.length - 1].word;
}

/** Payoff relative to the row's tier band: below it, inside it (two halves), above it. */
export function payoffWord(payoff: number | undefined, tier: 1 | 2 | 3 | undefined): string {
  if (payoff === undefined) return 'unset';
  if (!tier) return payoff < 1 ? 'modest' : 'ample';
  const [lo, hi] = UNDERTAKING_TIER_PAYOFF_BANDS[tier];
  if (payoff < lo) return 'below the tier';
  if (payoff > hi) return 'above the tier';
  return payoff <= lo + (hi - lo) / 2 ? 'modest for the tier' : 'ample for the tier';
}

export function durationWord(projectDuration: number | undefined): string {
  return projectDuration === undefined ? 'unset' : bandWord(projectDuration, DURATION_WORD_BANDS);
}

export function harmWord(harmClass: string): string {
  const magnitude = (HARM_MAGNITUDE_BY_CLASS as Record<string, number>)[harmClass];
  return magnitude === undefined ? 'unknown' : bandWord(magnitude, HARM_WORD_BANDS);
}

// ── Kind ─────────────────────────────────────────────────────────────

export function cellOf(row: UndertakingKindRow, templateId: string): KindCell | undefined {
  if (row.createTemplateIds.includes(templateId)) return 'create';
  if (row.updateTemplateIds.includes(templateId)) return 'update';
  if (row.destroyTemplateIds.includes(templateId)) return 'destroy';
  return undefined;
}

function kindBlock(templateId: string): PackageKindBlock | undefined {
  const kindId = getUndertakingKindForTemplate(templateId);
  const row = kindId ? getUndertakingKindRow(kindId) : undefined;
  if (!row) return undefined;
  const cell = cellOf(row, templateId);
  if (!cell) return undefined;
  return {
    row,
    cell,
    siblings: {
      create: row.createTemplateIds.filter(id => id !== templateId),
      update: row.updateTemplateIds.filter(id => id !== templateId),
      destroy: row.destroyTemplateIds.filter(id => id !== templateId),
    },
  };
}

// ── Contract ─────────────────────────────────────────────────────────

let contractContext: UndertakingContractContext | undefined;

/** Built once per page: the registry-wide validation is the expensive half. */
export function undertakingContractContext(): UndertakingContractContext {
  if (!contractContext) contractContext = buildUndertakingContractContext(getAllStrategicTemplates());
  return contractContext;
}

/** Test seam — a fixture registry must not read a stale context. */
export function resetUndertakingContractContext(): void {
  contractContext = undefined;
}

function verdictOf(template: StrategicActionTemplate): PackageVerdict {
  const report = checkUndertakingContract(template, undertakingContractContext());
  return {
    passed: report.passed,
    retrofitPending: isUndertakingRetrofitPending(template.id),
    failedBlocks: failedBlocks(report),
    violations: report.violations.map(v => ({ block: v.block, message: v.message })),
    warnings: [...report.warnings],
  };
}

// ── Mutation, in words ───────────────────────────────────────────────

const MUTATION_DETAIL: Readonly<Record<string, string>> = {
  create_trade_route: 'a trades_with edge from the origin to the target, and the road that carries it',
  create_sublocation: 'a sublocation inside the target, owned by the actor',
  create_location: 'a new place-tier settlement on an unclaimed site near the anchor',
  create_group: 'a company the actor leads, its bound recruits as members',
  record_intelligence: 'a strategicIntelligence entry on the actor about the target',
  mint_masterwork: 'an artifact the actor possesses',
  mint_leverage_mark: 'a knows_secret_of edge from the actor to the target',
  press_the_mark: 'the held mark spent against its subject',
};

function mutationBlock(template: StrategicActionTemplate): UndertakingPackage['mutation'] {
  const hint = template.mutationHint;
  if (!hint) return undefined;
  return { type: hint.type, detail: MUTATION_DETAIL[hint.type] ?? 'a graph op of this type (see strategicActionLifecycle)' };
}

// ── Build ────────────────────────────────────────────────────────────

const BAND_LABEL: Readonly<Record<PackageCreationBand['band'], string>> = {
  onAdvance: 'on an advancing checkpoint',
  onAtCost: 'on an at-cost checkpoint',
  onCritFailure: 'on a critical failure',
};

export function buildUndertakingPackage(template: StrategicActionTemplate): UndertakingPackage {
  const reaches = Object.entries(template.reachProfile ?? {})
    .filter((e): e is [string, number] => typeof e[1] === 'number')
    .sort((a, b) => b[1] - a[1])
    .map(([reach]) => reach);
  const kind = kindBlock(template.id);
  const creation = (['onAdvance', 'onAtCost', 'onCritFailure'] as const)
    .map(band => ({ band, label: BAND_LABEL[band], effects: template.creationEffects?.[band] ?? [] }));
  return {
    templateId: template.id,
    displayName: template.displayName,
    verb: template.verb,
    family: template.behaviorFamily,
    calling: CALLING_BY_FAMILY[template.behaviorFamily] ?? template.behaviorFamily,
    primaryReach: reaches[0],
    reaches,
    kind,
    board: {
      difficulty: difficultyWord(template.checkpointDifficulty ?? 0.5),
      payoff: payoffWord(template.payoffValue, kind?.row.tier),
      duration: durationWord(template.projectDuration),
      motivations: [...(template.motivations ?? [])],
      executionMode: template.executionMode,
    },
    cast: [...(template.cast ?? [])],
    creation,
    mutation: mutationBlock(template),
    harm: template.harmClass ? { harmClass: template.harmClass, magnitude: harmWord(template.harmClass) } : undefined,
    motiveGate: [...(template.motiveGate ?? [])],
    catalysts: [...(template.catalystEncounterIds ?? [])],
    prose: { activity: [...(template.activityProse ?? [])], completion: [...(template.completionProse ?? [])] },
    writeSet: undertakingWriteSet(template, kind?.row),
    verdict: verdictOf(template),
  };
}

export function undertakingPackageIndex(): readonly UndertakingPackageIndexRow[] {
  const rows = getAllUndertakingKindRows();
  return getAllStrategicTemplates()
    .map((t): UndertakingPackageIndexRow => {
      const kindId = getUndertakingKindForTemplate(t.id);
      const row = kindId ? rows.find(r => r.kindId === kindId) : undefined;
      const reaches = Object.entries(t.reachProfile ?? {}).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
      return {
        templateId: t.id,
        displayName: t.displayName,
        verb: t.verb,
        family: t.behaviorFamily,
        primaryReach: reaches[0]?.[0] as ReachDomain | undefined,
        kindId,
        cell: row ? cellOf(row, t.id) : undefined,
        tier: row?.tier,
        retrofitPending: isUndertakingRetrofitPending(t.id),
      };
    })
    .sort((a, b) => (a.kindId ?? '~').localeCompare(b.kindId ?? '~') || a.templateId.localeCompare(b.templateId));
}

export function undertakingTemplateById(templateId: string): StrategicActionTemplate | undefined {
  return getAllStrategicTemplates().find(t => t.id === templateId);
}
