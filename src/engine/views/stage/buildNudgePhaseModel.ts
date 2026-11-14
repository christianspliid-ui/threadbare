/**
 * buildNudgePhaseModel — THR-775 (WS2 interface).
 *
 * Turns the WS0 engine substrate (`nudges.ts`, `motiveClassifier.ts`,
 * `outcomeForecast.ts`) into the stage's nudge phase. Pure and read-only: it
 * mutates nothing, takes no rng draw, and calls only functions resolution
 * itself calls, so the forecast word the player reads is the word resolution
 * will compute from the same inputs.
 *
 * **Render policy per `NudgeBlockedCode`** (the Vision audit's blocking find).
 * WS0 routes `essence_unavailable` into `dimmed`, and a player's budget moves
 * *inside* one encounter as they toggle spends — so hiding unaffordable cards
 * would make them flicker in and out mid-decision. Hence:
 *
 * | code | player stage | designer view |
 * |---|---|---|
 * | (none — playable) | rendered | rendered |
 * | `essence_unavailable` | dimmed, with its reason | rendered |
 * | `sphere_locked` | withheld (ruling 4) | listed |
 * | `unlock_missing` | withheld (ruling 4) | listed |
 * | `trait_missing` | never rendered | listed |
 * | `no_target` | withheld (THR-2147) | listed |
 *
 * Withholding sphere/unlock cards is a *deliberate divergence* from the v3
 * mockup, which dimmed them to teach the pool. That teaching role moves to the
 * designer view; the player stage keeps the replayability pool unspoiled.
 *
 * Plan: `Docs/plans/2026-07-27-nudge-encounter-experience-ws1-ws2.md` § WS2
 */

import type { WorldGraph } from '../../graph';
import { formatEssenceLabel } from '../../../data/essence-format';
import type { GameState } from '../../../types/gameState';
import type { SphereName } from '../../../types/index';
import { toHungerId } from '../../../types/hunger';
import {
  buildRepertoire,
  echoCardsFromDefinitions,
} from '../../nudgeCardRepertoire';
import type { RepertoireEntry } from '../../nudgeCardRepertoire';
import type { ForecastTier } from '../../../types/traces/encounter-traces';
import type {
  ActionStep,
  StepNudge,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../types/unifiedAction';
import { isActionStepBranch } from '../../../types/unifiedAction';
import { getCapabilityTier } from '../../../data/domain-words';
import { DEFAULT_FORECAST_FACTORS } from '../../../data/encounter-contract-builder';
import {
  composeDealtStep,
  isDealtNudgeId,
  recordDealReport,
} from '../../encounters/dealHand';
import { computeBaseStepForecast, fightInputsForForecast } from './baseStepForecast';
import type { FightStepInputs } from '../../../types/fight';
import {
  FIGHT_NAMED_TERM_LINES,
  FIGHT_STANDING_MODIFIER_NAME,
} from '../../../data/fight-constants';
import {
  buildNudgeHand,
  collectHeldTraitIds,
  difficultyWord,
  effectiveNudgeCost,
  resolveTraitVariants,
  totalNudgeCost,
  type NudgeBlockedCode,
} from '../../encounters/nudges';
import {
  deriveStepFactorLines,
  deriveWhisperRevealLine,
  type WhisperNextStep,
} from '../../encounters/stepFactorLines';
import {
  ARTIFACT_CATEGORY_RESULT_NOUNS,
  COMPULSION_URGE_NOUNS,
  NUDGE_COST_CHANNEL_DISPLAY,
  formatNudgeResultLine,
  isResultLineGrantKind,
  nudgeCardKeyword,
  type NudgeCostChannelId,
  type ResultLineGrantKind,
} from '../../../data/nudge-card-display';
import { AMBITION_TEMPLATES } from '../../../data/ambition-templates';
import type { EncounterType } from '../../../types/encounter';
import {
  classifyMotive,
  readMotiveReceipt,
} from '../../encounters/motiveClassifier';
import { computeForecast } from '../../encounters/outcomeForecast';
import { adaptUnifiedActionTemplateToEncounterContract } from '../../encounter-contract-adapter';
import {
  enrichProse,
  gatherNarrativeContext,
  type NarrativeContext,
} from '../../proseEnrichment';
import type { SimulationRuntime } from '../../simulationRuntime';
import {
  FORECAST_TIER_WORDS,
  MOTIVE_CHIP_LABELS,
  MOTIVE_FALLBACK_SENTENCES,
  NUDGE_BLOCKED_REASONS,
  NUDGE_COST_NOTES,
  NUDGE_ESSENCE_SHORT_REASONS,
  NUDGE_FREE_COST_LABEL,
  NUDGE_RIDER_LABELS,
} from '../../../data/nudge-stage-content';
import { ESSENCE_REFILL_WORDS, type EssenceRefillBand } from '../../../data/essence-refill-content';
import { sphereWord } from '../../../data/essence-format';
import { readEssenceRefill } from '../essenceRefill';
import { mandateDeedSpheres } from '../../mandateLedger';
import { MANDATE_CARD_HINT } from '../../../data/ascendant-bar-content';
import { SPHERE_NAMES } from '../../../types/index';
import { getSpherePoints, rankSpherePoints } from '../../spherePoints';
import { NUDGE_ESSENCE_COST_SCALE } from '../../../data/nudge-constants';
import type {
  EncounterStageCostChannelModel,
  EncounterStageFactorLineModel,
  EncounterStageForecastModel,
  EncounterStageNudgeCardModel,
  EncounterStageNudgePhaseModel,
  EncounterStageSkillModel,
  EncounterStageWithheldNudgeModel,
} from './types';

/**
 * Codes the player stage withholds entirely. `essence_unavailable` is
 * deliberately absent — see the render-policy table above.
 */
const WITHHELD_CODES: ReadonlySet<NudgeBlockedCode> = new Set([
  'sphere_locked',
  'unlock_missing',
  // THR-2147 — a card with nothing to act on is never sold to the player.
  'no_target',
]);

export interface BuildNudgePhaseModelArgs {
  template: UnifiedActionTemplate;
  activeAction: UnifiedAction;
  /** The resolved step definition for `activeAction.currentStep`. */
  step: ActionStep;
  graph: WorldGraph;
  gameState?: GameState;
  /**
   * THR-923 — the enrichment context authored nudge prose is resolved against.
   *
   * Optional so no caller *breaks*, but never load-bearing: absent, the builder
   * gathers its own from `graph` + the acting id. Enrichment is therefore a
   * property of this builder rather than of remembering to pass something, which
   * is the whole reason the gap existed — every field below was assigned straight
   * off the template and no caller had a reason to notice.
   */
  narrativeContext?: NarrativeContext;
  /** Phrase-dedup history for `{outcome_phrase}` / `{q_flavor}`; fail-soft when absent. */
  runtime?: SimulationRuntime;
  /**
   * Build the phase even when this step authored no nudges (THR-1121).
   *
   * The caller sets this when the step has nothing else to offer either — no
   * authored choices, and no generic stance set now that
   * `generateInterventionChoices` is retired. The result is the stage's
   * **fate-alone** screen: the motive line, the test panel, `Nothing here answers
   * to you. Let it play out.` in place of the hand, and `Stay silent, let fate answer` as the
   * only move.
   *
   * That is the Nudge Model working rather than a gap — a step where the god has
   * no purchase is a real state the model is *for*, and it now reads that way
   * instead of falling back to a paid stance triple. Left `false`, the builder
   * keeps its original bail so a step with an authored *choice* hand still gets
   * the choice screen (30 templates rely on it, pending WS5 conversion).
   */
  allowEmptyHand?: boolean;
}

/**
/*
 * THR-884's `settingClassForAction` is **gone** (THR-1225). It resolved the
 * `SettingClass` an in-flight encounter played out in, for the sole purpose of
 * feeding `NudgeContext.settingClass` → the `fictionBySetting` fold. Both the
 * fold and the field it varied are retired, so the producer had no consumer
 * left. Template openings still vary by setting class through their own path.
 */

/** Cost in words — a free (trait) option says so rather than showing a zero. */
function costLabelFor(cost: number): string | undefined {
  if (cost <= 0) return NUDGE_FREE_COST_LABEL;
  // THR-1006 — never interpolate the raw float: accumulated fractional costs
  // reach this as `193.60000000000005`.
  return formatEssenceLabel(cost);
}

/**
 * THR-890 — the non-essence prices a card charges, in display form.
 *
 * A zero delta contributes no row: an authored `{ doomDelta: 0 }` is a channel
 * the card declared and then did not use, and drawing it would promise a price
 * that never arrives. Direction, not just sign, picks the wording — a card that
 * *slows* the doom clock is charging nothing and should not read as a cost.
 */
function costChannelsFor(nudge: StepNudge): EncounterStageCostChannelModel[] | undefined {
  const costs = nudge.costs;
  if (!costs) return undefined;

  const deltas: readonly [NudgeCostChannelId, number | undefined][] = [
    ['detection', costs.detectionDelta],
    ['doom', costs.doomDelta],
  ];

  const channels: EncounterStageCostChannelModel[] = [];
  for (const [id, delta] of deltas) {
    if (delta === undefined || delta === 0) continue;
    const display = NUDGE_COST_CHANNEL_DISPLAY[id][delta > 0 ? 'worse' : 'better'];
    channels.push({ id, icon: display.icon, label: display.label, delta });
  }
  return channels.length > 0 ? channels : undefined;
}

/**
 * One authored option as a card the row can draw.
 *
 * Shared by the playable and dimmed passes so the two can never drift on price,
 * keyword, or cost channels — the only thing that differs between them is the
 * `state`/`blocked` pair the caller supplies.
 *
 * **Price is the effective price.** `effectiveNudgeCost` is what `buildNudgeHand`
 * used to judge affordability and what `totalNudgeCost` will charge at commit, so
 * anything else here would quote one number and bill another (THR-885's whole
 * reason for exporting that helper).
 *
 * **Every authored string leaves here enriched (THR-923).** `name` and
 * `effectLine` are authored prose and carry the same placeholder vocabulary the
 * rest of the encounter does; assigning them straight off the template shipped
 * literal `{they}` / `{actor}` onto the stage. (`fiction` was a third such
 * string until THR-1225 retired the field.)
 */
/**
 * How the god came to hold a dealt card, in words.
 *
 * Provenance, not mechanics: the player is being told *whose* card this is, so
 * they can read a hand as part their god and part this scene. An authored card
 * gets no line — saying "this one is ordinary" would be noise on every card in
 * the corpus to distinguish the few that are not.
 *
 * Prose Doctrine v2 governs this line as it governs the face: direct, no flavor
 * quote, no numeral.
 */
function dealtProvenanceLine(
  nudge: StepNudge,
  sources: ReadonlyMap<string, RepertoireEntry['source']> | undefined,
): EncounterStageNudgeCardModel['provenance'] {
  if (!sources || !nudge.libraryCardId || !isDealtNudgeId(nudge.id)) return undefined;
  const source = sources.get(nudge.libraryCardId);
  if (!source) return undefined;

  const PREFIX = 'From your repertoire';
  const assemble = (
    parts: { conceptLabel?: string; conceptTooltipId?: string; suffix?: string },
  ): EncounterStageNudgeCardModel['provenance'] => ({
    prefix: PREFIX,
    ...parts,
    text: [PREFIX, [parts.conceptLabel, parts.suffix].filter(Boolean).join(' ')]
      .filter(Boolean)
      .join(' — '),
  });

  // A sphere-derived source names its sphere, which is a game concept and so
  // carries its own tooltip (Laws 1 + 17). Every other source names no concept
  // and is a plain clause.
  const sphere = nudge.sphere;
  switch (source) {
    case 'signature':
    case 'sphere_attunement':
      return sphere
        ? assemble({
            conceptLabel: capitalise(sphere),
            conceptTooltipId: `sphere.${sphere}`,
            suffix: source === 'signature' ? 'signature.' : 'attunement.',
          })
        : assemble({ suffix: 'yours by alignment.' });
    case 'discovery':
      // THR-1753 — a Foundation sphere opened by elder magic found in a ruin.
      return sphere
        ? assemble({
            conceptLabel: capitalise(sphere),
            conceptTooltipId: `sphere.${sphere}`,
            suffix: 'found in the ruins.',
          })
        : assemble({ suffix: 'found in the ruins.' });
    case 'hunger':
      return assemble({ suffix: 'born of your hunger.' });
    case 'milestone':
      return assemble({ suffix: 'earned as you rose.' });
    case 'god_trait':
      return assemble({ suffix: 'earned by what you became.' });
    case 'echo':
      return assemble({ suffix: 'carried out of a former age.' });
    case 'core':
    default:
      return assemble({ suffix: 'always yours.' });
  }
}

const warnedResultLines = new Set<string>();

/**
 * The noun a grant's result line names, read from the world (plan THR-2146 E2).
 * Undefined ⇒ the kind's fallback sentence. The spell a `spell_grant` teaches is
 * picked when the card resolves, so it is never known here.
 */
function resultLineThing(grant: NonNullable<StepNudge['grants']>[number], graph: WorldGraph): string | undefined {
  switch (grant.kind) {
    case 'remove_condition':
      return graph.getNode(grant.conditionTraitId)?.name;
    case 'spawn_artifact':
      if (grant.nameOverride) return grant.nameOverride;
      return grant.category ? ARTIFACT_CATEGORY_RESULT_NOUNS[grant.category] : undefined;
    case 'assign_ambition':
      return AMBITION_TEMPLATES.find((t) => t.id === grant.templateId)?.displayName;
    case 'plant_compulsion': {
      // The strongest lean is where the urge points.
      let best: EncounterType | undefined;
      let bestWeight = 0;
      for (const [type, weight] of Object.entries(grant.encounterBias) as [EncounterType, number | undefined][]) {
        if ((weight ?? 0) > bestWeight) { best = type; bestWeight = weight ?? 0; }
      }
      return best ? COMPULSION_URGE_NOUNS[best] : undefined;
    }
    default:
      return undefined;
  }
}

/** Kinds whose sentence never names a noun, so no fallback is worth a warning. */
const NOUNLESS_RESULT_KINDS: ReadonlySet<ResultLineGrantKind> = new Set([
  'emit_omen', 'favor_creation', 'hidden_mark', 'spell_grant',
]);

/**
 * THR-2147 — the result line for a card that does not move the odds: the first
 * grant with a line, naming the acting mortal. Undefined for a card that moves
 * the odds (its pips answer) or carries no such grant (fail-soft: it renders as
 * before). An unresolved noun takes the fallback and warns once (Law 14).
 */
export function nudgeResultLine(
  nudge: Pick<StepNudge, 'id' | 'grants' | 'forecastDelta'>,
  graph: WorldGraph,
  actorName: string,
): string | undefined {
  if (nudge.forecastDelta !== 0 || !nudge.grants) return undefined;
  const grant = nudge.grants.find((g) => isResultLineGrantKind(g.kind));
  if (!grant || !isResultLineGrantKind(grant.kind)) return undefined;
  const thing = resultLineThing(grant, graph);
  if (thing === undefined && !NOUNLESS_RESULT_KINDS.has(grant.kind)) {
    const key = `${nudge.id}:${grant.kind}`;
    if (!warnedResultLines.has(key)) {
      warnedResultLines.add(key);
      console.warn(`[nudges] result line for ${nudge.id} (${grant.kind}) has no noun; using the fallback`);
    }
  }
  return formatNudgeResultLine(grant.kind, actorName, thing);
}

function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function buildNudgeCardModel(
  nudge: StepNudge,
  accessibleSpheres: readonly SphereName[],
  state: 'playable' | 'dimmed',
  enrich: (text: string) => string,
  blocked?: NudgeBlockedCode,
  /**
   * THR-1247 — library card id → why the god holds it, for the dealt card's
   * provenance line. Absent (every non-dealt caller) ⇒ no line, which is the
   * correct rendering for a card the encounter authored.
   */
  repertoireSources?: ReadonlyMap<string, RepertoireEntry['source']>,
  /** THR-2201 — authored-cost multiplier; step cards pass `NUDGE_ESSENCE_COST_SCALE`. Absent ⇒ 1. */
  costScale?: number,
): EncounterStageNudgeCardModel {
  const cost = effectiveNudgeCost(nudge, accessibleSpheres, costScale);
  const undiscounted = effectiveNudgeCost(nudge, [], costScale);
  const keyword = nudgeCardKeyword(nudge.libraryCardId);
  return {
    provenance: dealtProvenanceLine(nudge, repertoireSources),
    id: nudge.id,
    libraryCardId: nudge.libraryCardId,
    keyword: keyword?.keyword,
    keywordIconName: keyword?.iconName,
    keywordTypeId: keyword?.typeId,
    name: enrich(nudge.name),
    effectLine: enrich(nudge.effectLine),
    essenceCost: cost,
    discounted: cost < undiscounted,
    costLabel: costLabelFor(cost),
    costChannels: costChannelsFor(nudge),
    sphere: nudge.sphere,
    imageTag: nudge.imageTag,
    state,
    blockedCode: blocked,
    blockedReason: blocked ? NUDGE_BLOCKED_REASONS[blocked] : undefined,
    riderLabel: nudge.rider ? NUDGE_RIDER_LABELS[nudge.rider] : undefined,
    forecastDelta: nudge.forecastDelta,
  };
}

function forecastModelFrom(tier: ForecastTier, probability: number): EncounterStageForecastModel {
  return { tier, word: FORECAST_TIER_WORDS[tier], probability };
}

/**
 * The encounter's own authored factor lines for this step, sliced by the same
 * probability-driven count rule the forecast phase applies. Fail-soft: a
 * template with no decodable contract, or a step past the end of the beat list,
 * contributes no lines rather than throwing.
 */
const PLACEHOLDER_FACTOR_LINES: ReadonlySet<string> = new Set(DEFAULT_FORECAST_FACTORS);

function authoredFactorLines(
  template: UnifiedActionTemplate,
  stepIndex: number,
  probability: number,
): readonly string[] {
  try {
    const contract = adaptUnifiedActionTemplateToEncounterContract(template);
    const beat = contract.encounter.beats[stepIndex];
    // `EncounterForecastFactors` is a tuple with optional tail entries, so the
    // holes are dropped before the pool is sliced.
    // THR-1724 — the contract builder's stock "The threads are shifting." is a
    // placeholder, not an authored account of the odds; a step with nothing
    // authored shows no factor line at all rather than filler.
    const pool = (beat?.forecast_factors ?? []).filter(
      (line): line is string => typeof line === 'string' && line.length > 0
        && !PLACEHOLDER_FACTOR_LINES.has(line),
    );
    return computeForecast(
      { forecastFactors: pool },
      { baseProbability: probability, modifiers: [] },
    ).factors;
  } catch {
    return [];
  }
}

/**
 * THR-2201 — the god's own spheres: the ones it bought points in at Remembrance
 * (`getSpherePoints` > 0), largest buy first, primary leading. These alone earn
 * the sphere discount (rulebook §7, Law 37) and alone pay a sphere-less card
 * (`spendNudgeEssence`'s `payableSpheres`). Holding a little essence in a
 * sphere — the 4% income floor keeps every pool above 0 — is not owning it.
 *
 * Shared by the stage and `__DEBUG.getEncounterNudges` so the two price a card
 * the same. Fail-soft: no ascendant node or no points ⇒ the identity's primary
 * alone (when known), else `[]`; never throws.
 */
export function homeSpheresFor(
  gameState: Pick<GameState, 'graph' | 'ascendantId' | 'ascendantIdentity'> | null | undefined,
): SphereName[] {
  if (!gameState) return [];
  const alignment = gameState.ascendantIdentity?.sphereAlignment;
  const primary = alignment?.primary as SphereName | undefined;
  let ranked: SphereName[] = [];
  try {
    const props = gameState.ascendantId
      ? (gameState.graph?.getNode(gameState.ascendantId)?.properties as Record<string, unknown> | undefined)
      : undefined;
    // No ascendant node (hand-built fixtures, a pre-node state): the identity's
    // alignment preset, which is what `getSpherePoints` itself falls back to.
    ranked = rankSpherePoints(getSpherePoints(props ?? (alignment ? { sphereAlignment: alignment } : null)));
  } catch {
    ranked = [];
  }
  if (ranked.length === 0) return primary ? [primary] : [];
  if (primary && ranked.includes(primary)) return [primary, ...ranked.filter((s) => s !== primary)];
  return ranked;
}

/**
 * Essence readable per sphere. A sphere-less card reads the sum of the god's own
 * spheres (THR-2201 — never the twelve pools added together), which is exactly
 * what `spendNudgeEssence` can reach when it charges one. Mirrors the reader
 * `__DEBUG.getEncounterNudges` uses so the hand the bridge reports and the hand
 * the stage renders can never disagree.
 *
 * `homeSpheres` empty (legacy run, no identity) ⇒ the whole pool, today's read.
 */
export function essenceReader(
  pool: Readonly<Record<string, number>> | undefined,
  homeSpheres: readonly SphereName[] = [],
) {
  return (sphere: SphereName | undefined): number => {
    if (!pool) return 0;
    if (sphere) return pool[sphere] ?? 0;
    if (homeSpheres.length > 0) return homeSpheres.reduce((sum, s) => sum + (pool[s] ?? 0), 0);
    return Object.values(pool).reduce((sum, v) => sum + (v ?? 0), 0);
  };
}

/**
 * THR-2206 — the pool a card short of essence is short in: its own sphere, or,
 * for a sphere-less card, the god's primary (which `spendNudgeEssence` bills
 * first). Undefined for a sphere-less card on a run with no primary — the
 * reason then stays generic rather than naming a pool it cannot vouch for.
 * Shared by the stage and `__DEBUG.getEncounterNudges` so the reason and the
 * bridge's `shortSphere` can never name different pools.
 */
export function nudgeShortSphere(
  nudge: { sphere?: SphereName },
  primary: SphereName | undefined,
): SphereName | undefined {
  return nudge.sphere ?? primary;
}

/**
 * THR-2206 — the greyed card's reason, naming the short pool and its refill word
 * (plan § Player-facing text). `signed` ⇒ the card's own sphere is short;
 * otherwise `sphere` is the god's primary, paying first for a sphere-less card.
 * No band (the ledger read failed) ⇒ the bare form, never an invented word.
 */
export function essenceShortReason(
  sphere: SphereName,
  signed: boolean,
  band: EssenceRefillBand | undefined,
): string {
  const name = sphereWord(sphere);
  const row = band ? ESSENCE_REFILL_WORDS[band].row : '';
  const refill = row ? row.charAt(0).toLowerCase() + row.slice(1) : '';
  const template = signed
    ? (refill ? NUDGE_ESSENCE_SHORT_REASONS.signed : NUDGE_ESSENCE_SHORT_REASONS.signedBare)
    : (refill ? NUDGE_ESSENCE_SHORT_REASONS.common : NUDGE_ESSENCE_SHORT_REASONS.commonBare);
  return template.replace('{sphere}', name).replace('{refill}', refill);
}

/**
 * THR-2206 — the price hover's extra line. A sphere-less card on an identity run
 * says it is paid from the god's own spheres, primary first; a discounted card
 * says which home sphere made it one cheaper. Anything else ⇒ no line.
 */
export function nudgeCostNote(
  card: { sphere?: SphereName; discounted?: boolean },
  primary: SphereName | undefined,
): string | undefined {
  if (!card.sphere) {
    return primary ? NUDGE_COST_NOTES.common.replace('{sphere}', sphereWord(primary)) : undefined;
  }
  return card.discounted ? NUDGE_COST_NOTES.discounted.replace('{sphere}', sphereWord(card.sphere)) : undefined;
}

/**
 * What the step after `currentStep` demands, as far as it can honestly be read.
 *
 * A branch entry resolves to `unsettled` rather than being unwrapped: which
 * variant runs depends on how the current step lands, so its reach and
 * difficulty are not facts yet. Reading one anyway would let the Whisper quote a
 * demand the encounter may never make.
 */
function readNextStepDemand(
  template: UnifiedActionTemplate,
  currentStep: number,
  fightInputsFor?: (step: ActionStep) => FightStepInputs | undefined,
): WhisperNextStep {
  const next = template.steps?.[currentStep + 1];
  if (!next) return { kind: 'none' };
  if (isActionStepBranch(next)) return { kind: 'unsettled' };
  // THR-1543 (fight block § Content pillar) — a fight step's authored reach and
  // difficulty are placeholders the roll never reads; the Whisper quotes what the
  // opponent's card will actually ask.
  const fight = next.fightRole ? fightInputsFor?.(next) : undefined;
  if (fight) return { kind: 'demand', reach: fight.reach, difficulty: fight.difficulty };
  return { kind: 'demand', reach: next.reach, difficulty: next.difficulty };
}

/**
 * THR-1670 — the link on a step cast's factor line: the spell's name, pointing at
 * its shared definition node. Empty when the contribution cannot be found.
 */
function spellLinkFor(
  source: string,
  contributions: readonly { kind: string; sourceId: string; sourceName: string }[],
): { link?: { text: string; entityId: string; kind: 'attachment' } } {
  const found = contributions.find((c) => c.kind === 'spell' && `spell:${c.sourceId}` === source);
  return found ? { link: { text: found.sourceName, entityId: found.sourceId, kind: 'attachment' } } : {};
}

/** The factor line for one of the fight's own named terms (courage, momentum, an advantage). */
function fightTermLine(name: string, delta: number, label: string | undefined): string {
  if (label) return label;
  const words = FIGHT_NAMED_TERM_LINES[name];
  if (!words) return name;
  return delta >= 0 ? words.for : words.against;
}

/**
 * Build the stage's nudge phase, or `undefined` when this step has no authored
 * hand and the caller has something else to render — the caller branches on that
 * to keep authored-choice templates on the choice screen (per-template rollout,
 * no flag day). With `allowEmptyHand`, an unauthored step builds anyway and
 * renders fate-alone (THR-1121).
 *
 * Fail-soft (NFP #4): a missing agent node, an absent essence pool, and a
 * throwing motive classification all degrade to a rendered stage rather than a
 * blank one. Nothing here can throw into the tick loop — it runs in the UI.
 */
export function buildNudgePhaseModel(
  args: BuildNudgePhaseModelArgs,
): EncounterStageNudgePhaseModel | undefined {
  const { template, activeAction, step, graph, gameState } = args;

  // THR-1121 — normalized to an array rather than left possibly-undefined. The
  // early return below used to guarantee non-emptiness for everything after it,
  // so the withheld-card pass further down dereferences this directly; with
  // `allowEmptyHand` that guarantee is gone and an unauthored step would throw
  // there instead of rendering fate-alone.
  const authored = step.nudges ?? [];
  // THR-1248 — a step that declares a `deal` is nudge-bearing even with no
  // authored specials. The composed model puts specials at **0**–2 (the spec's
  // § 3b; `checkComposedHand` validates a declaration "with or without
  // specials"), so a fully-dealt hand is legal content — and without this the
  // builder returned `undefined` for it, which meant the god's own repertoire
  // could be dealt into a hand no surface would ever build. The empty-hand
  // dereference THR-1121 warns about is already handled below, so this rides
  // the same safety it does rather than needing its own.
  if (authored.length === 0 && step.deal === undefined && !args.allowEmptyHand) return undefined;

  const actorId = activeAction.actorId;

  // THR-923 — every authored string this builder emits goes through here.
  //
  // The gap this closes was structural, not a typo: the nudge adapter assigned
  // card fiction, effect lines, factor lines and the purpose line straight off
  // the template, so an encounter that resolved `{they}` correctly in its header
  // (built by `buildUnifiedEncounterStageModel`, which does enrich) shipped the
  // raw token two inches below it on the same card. Reusing the caller's context
  // when it threads one keeps this to zero extra graph traversals on the live
  // path; gathering our own otherwise means a test or a future caller cannot
  // silently reopen the hole.
  const ctx =
    args.narrativeContext ??
    gatherNarrativeContext(
      graph,
      actorId,
      undefined,
      undefined,
      undefined,
      gameState,
      undefined,
      {
        targetId: activeAction.targetId,
        supportBundle: template.supportBundle,
        supportBindings: activeAction.supportBindings,
        contextFragments: template.contextFragments,
        contextFragmentTemplateId: template.id,
        bindsFaction: template.bindsFaction,
        templateReach: template.reach, // THR-1635 — the {frag:place_fact} line
      },
    );
  const enrich = (text: string): string => enrichProse(text, ctx, { runtime: args.runtime });

  const heldTraits = collectHeldTraitIds(graph, actorId);
  const pool = gameState?.essencePool as Readonly<Record<string, number>> | undefined;
  // THR-2201 — the god's own spheres: the discount list, and the only pools a
  // sphere-less card may be paid from.
  // Identity runs only — the same condition that sets `budgetSphere` below. A
  // legacy archetype run has no budget sphere for the hook to check sphere-less
  // cards against, so narrowing its commit reach would let the hand select what
  // the commit then refuses (review round 2); it keeps today's whole-pool rules.
  const homeSpheres = gameState?.ascendantIdentity ? homeSpheresFor(gameState) : [];
  const availableEssenceFor = essenceReader(pool, homeSpheres);

  // Accessible spheres are the ones the ascendant actually holds essence in.
  // An empty/absent pool yields an empty list, which dims every sphere card
  // rather than throwing — the fail-soft path, not a special case. This is the
  // `sphere_locked` gate only; the *discount* follows `homeSpheres` (THR-2201).
  const accessibleSpheres = SPHERE_NAMES.filter((s) => (pool?.[s] ?? 0) > 0);
  // Legacy run with no identity: no home list, so keep today's discount reach.
  const discountSpheres = homeSpheres.length > 0 ? homeSpheres : accessibleSpheres;

  // THR-887 — the god's repertoire, so an authored option signed by a sphere
  // this god does not hold is withheld rather than merely priced.
  //
  // Gated on a *present* `ascendantIdentity`, and deliberately left `undefined`
  // without one. A legacy archetype-based run has no sphere identity to read,
  // and defaulting it to "no spheres" would silently withhold every signature
  // card from those runs — a behavior change dressed as a fallback. Absent
  // identity ⇒ absent gate ⇒ today's behavior exactly (NFP #6).
  const identity = gameState?.ascendantIdentity;
  // THR-1247 — the full entries, not only their ids. The dealer scores on a
  // member's provenance (`entry.source`) as well as its sphere, so it needs the
  // repertoire rows themselves; the id set below is derived from them rather
  // than built by a second `buildRepertoire` call.
  const repertoireEntries = identity
    ? buildRepertoire({
          primary: identity.sphereAlignment?.primary,
          secondary: identity.sphereAlignment?.secondary,
          // THR-891 — `hungerId` is stored dotted (`hunger.witness`) while the
          // library keys on the bare id. This was an `as HungerId` cast, which
          // type-checks and is false: the lookup missed for every god, so no
          // hunger unique was ever dealt. `toHungerId` is the real conversion.
          hunger: toHungerId(identity.hungerId),
          unlockedActionIds: new Set(gameState?.unlockedActionIds ?? []),
          // THR-1180 — passed straight through, absent and all. An absent
          // counter is a legacy run that never earned anything, and the unlock
          // reads it as all-zero, so attunement members stay locked rather than
          // falling open on the saves least able to have earned them.
          essenceEarnedBySphere: gameState?.essenceEarnedBySphere,
          // THR-1753 — Foundation spheres found in ruins open their signed cards.
          discovered: gameState?.foundationSpheresFound,
        echoCards: echoCardsFromDefinitions(gameState?.echoDefinitions ?? []),
      })
    : undefined;
  const repertoireCardIds = repertoireEntries
    ? new Set(repertoireEntries.map((entry) => entry.member.id))
    : undefined;

  // THR-1247 — the dealt hand. When this step declares `deal`, the god's
  // Repertoire fills the hand around whatever the encounter authored; when it
  // does not, `composeDealtStep` hands back the *same step object* and nothing
  // downstream can tell dealing exists (NFP #6).
  //
  // Composed here, upstream of `buildNudgeHand`, which is deliberately
  // untouched: a minted card is an ordinary `StepNudge`, so partitioning,
  // pricing, gating and commit all treat it exactly as an authored one. If
  // anything below this line ever needs to know a card was dealt, the design
  // has been violated.
  const { step: composedStep, report: dealReport } = composeDealtStep(step, repertoireEntries, {
    primarySphere: identity?.sphereAlignment?.primary,
    secondarySphere: identity?.sphereAlignment?.secondary,
    tags: step.deal?.tags,
  });
  if (dealReport) recordDealReport(template.id, dealReport);

  const hand = buildNudgeHand(composedStep, template, {
    availableEssence: availableEssenceFor,
    accessibleSpheres,
    discountSpheres,
    costScale: NUDGE_ESSENCE_COST_SCALE,
    unlockedTemplateIds: new Set(gameState?.unlockedActionIds ?? []),
    heldTraits,
    repertoireCardIds,
  });

  const variants = resolveTraitVariants(template, heldTraits);

  // ── Forecast baseline ───────────────────────────────────────────
  // The same additive channel resolution uses: capability + standing modifiers
  // + trait-variant contribution. The *nudge* contribution is deliberately
  // excluded here — `forecastInput.actionModifiers` is the floor the hand adds
  // its selected deltas onto, so the hook can recompute without re-deriving
  // capability on every toggle.
  //
  // THR-1543 (fight block §3b) — a fight step forecasts from the inputs the roll
  // uses: the card's reach and difficulty, the fighter's standing modifiers read in
  // a combat context, and the fight's named terms (courage, momentum, advantages).
  // Pure: reading the advantages here spends nothing.
  // THR-1670 — the step cast: the record the roll wrote, or the same pure decision
  // it will make (the decision reads no card, so toggling cards never changes it).
  // One `spell` line rides the standing read below, for the forecast and the roll.
  // THR-2211 — lifted into `baseStepForecast.ts` so the step poster's Fated fuse
  // reads this exact call (Law 18).
  const {
    fightInputs,
    stepReach,
    capability,
    standing,
    carryover,
    traitModifierTotal,
    effectiveDifficulty,
    forecastScale,
    forecastInput,
    baseSummary,
  } = computeBaseStepForecast(graph, gameState, activeAction, template, step, variants);
  const baseForecast = forecastModelFrom(
    baseSummary.forecastTier,
    baseSummary.successProbability,
  );

  // ── Cards ───────────────────────────────────────────────────────
  const cards: EncounterStageNudgeCardModel[] = [];
  const withheld: EncounterStageWithheldNudgeModel[] = [];
  // THR-1247 — provenance for the dealt half of the hand. Empty map when this
  // god has no repertoire, which yields no provenance lines and today's exact
  // card face.
  const repertoireSources = new Map(
    (repertoireEntries ?? []).map((entry) => [entry.member.id, entry.source] as const),
  );

  // THR-2147 — a card that does not move the odds says what it does instead.
  const actorName = graph.getNode(actorId)?.name ?? 'them';
  const withResultLine = (card: EncounterStageNudgeCardModel, nudge: StepNudge): EncounterStageNudgeCardModel => {
    const resultLine = nudgeResultLine(nudge, graph, actorName);
    return resultLine ? { ...card, resultLine } : card;
  };

  for (const entry of hand.playable) {
    cards.push(withResultLine(
      buildNudgeCardModel(entry.nudge, discountSpheres, 'playable', enrich, undefined, repertoireSources, NUDGE_ESSENCE_COST_SCALE),
      entry.nudge,
    ));
  }

  for (const entry of hand.dimmed) {
    const { nudge, blocked } = entry;
    if (blocked && WITHHELD_CODES.has(blocked)) {
      withheld.push({ id: nudge.id, name: enrich(nudge.name), blockedCode: blocked });
      continue;
    }
    cards.push(withResultLine(
      buildNudgeCardModel(nudge, discountSpheres, 'dimmed', enrich, blocked, repertoireSources, NUDGE_ESSENCE_COST_SCALE),
      nudge,
    ));
  }

  // Trait-gated cards the agent cannot hold: never in the player stage, listed
  // for the designer so an authored-but-unreachable card stays visible to us.
  const byId = new Map(authored.map((n) => [n.id, n]));
  for (const id of hand.hidden) {
    withheld.push({
      id,
      name: byId.get(id)?.name ?? id,
      blockedCode: 'trait_missing',
    });
  }

  // ── Test panel ──────────────────────────────────────────────────
  // Authored factor lines first (the encounter's own account of the odds),
  // then the live trait-derived lines.
  //
  // THR-820 gave the step a `factorLines` field, so a nudge-native encounter
  // declares its own polarity and the panel colours authored lines the way it
  // colours a trait line. A step without it falls back to the contract's
  // `beat.forecast_factors` — the same authored pool `phaseAscendantHandFilter`
  // reads, sliced by the same `computeForecast` count rule, so the stage and
  // the notification never quote different numbers of factors. That pool is a
  // bare string tuple with no sign, hence `neutral`: claiming a polarity there
  // would invent information the encounter never stated.
  const factors: EncounterStageFactorLineModel[] = [];
  if (step.factorLines && step.factorLines.length > 0) {
    for (const [index, line] of step.factorLines.entries()) {
      factors.push({ id: `authored:${index}`, text: enrich(line.text), polarity: line.polarity });
    }
  } else {
    for (const [index, text] of authoredFactorLines(template, activeAction.currentStep,
      baseSummary.successProbability).entries()) {
      factors.push({ id: `authored:${index}`, text: enrich(text), polarity: 'neutral' });
    }
  }
  for (const variant of variants) {
    // A trait factor names its trait (canon rule 1). Polarity reads off the
    // trait's own contribution: easing the step or steepening it.
    const helps = (variant.forecastDelta ?? 0) >= 0 && (variant.difficultyDelta ?? 0) <= 0;
    factors.push({
      id: `trait:${variant.traitId}`,
      text: enrich(variant.factorLine),
      polarity: helps ? 'for' : 'against',
      source: `trait:${variant.traitId}`,
      // THR-892 — the model carries the number beside the text so the row can
      // draw pips. A variant that declares no delta contributes no pips rather
      // than a zero row.
      delta: variant.forecastDelta,
    });
  }

  // ── Derived lines (THR-892) ─────────────────────────────────────
  // The variance rule: a line earns its place only if it could have read
  // differently on another run. These are projections of the numbers resolution
  // already computed — `capability` and `standing.contributions` — so the panel
  // can never quote a factor the roll did not apply.
  //
  // Appended after the authored/trait lines so the encounter's own account leads
  // and the world's contribution follows.
  // THR-1724 — the skill line ("Vara is skilled in Stone.") leaves the list:
  // its content is the title row's reach readout now, and its sentence rides
  // along as that chip's tooltip so the actor is still named.
  let skill: EncounterStageSkillModel | undefined;
  for (const line of deriveStepFactorLines({
    actorName: graph.getNode(actorId)?.name,
    reach: stepReach,
    capability,
    contributions: standing.contributions,
    carryover,
  })) {
    if (line.kind === 'skill') {
      skill = {
        tier: getCapabilityTier(Number.isFinite(capability) ? capability : 0),
        sentence: line.text,
      };
      continue;
    }
    factors.push({
      id: line.id,
      // THR-1738 — the carryover line is authored prose like the step's own
      // factor lines, so it takes the same placeholder fill ({actor},
      // {cast:<key>}). The other derived lines are composed from resolved names.
      text: line.kind === 'carryover' ? enrich(line.text) : line.text,
      polarity: line.polarity,
      source: line.source,
      // Three cases collapse to two here. A line may state a real contribution,
      // state that its contribution is measurably zero (the Whisper reveal), or
      // have no contribution to state at all (the skill line — THR-977). The
      // last two both mean "draw no pips": the model's `delta` is absent, never
      // zero, because a zero would draw an empty row promising a magnitude.
      delta: line.delta === 0 ? undefined : line.delta,
      // THR-1670 — the cast line names its spell, and the name opens its Power page.
      ...(line.kind === 'spell' ? spellLinkFor(line.source, standing.contributions) : {}),
    });
  }

  // ── The fight's named terms (THR-1543, fight block §7, §11) ─────
  // Courage, momentum and each advantage the world lent the fighter, as factor
  // lines with no hidden number. The standing term is already spoken for by the
  // derived lines above, which project the same contributions.
  for (const term of fightInputs?.modifiers ?? []) {
    if (term.name === FIGHT_STANDING_MODIFIER_NAME || term.delta === 0) continue;
    factors.push({
      id: `fight:${term.name}`,
      text: enrich(fightTermLine(term.name, term.delta, term.label)),
      polarity: term.delta >= 0 ? 'for' : 'against',
      source: `fight:${term.name}`,
      delta: term.delta,
    });
  }

  // ── The Whisper's reveal (THR-1179) ─────────────────────────────
  // The one card that pays for a *line* rather than for odds. It renders only
  // once no matter how many Whispers are committed — a second copy of the same
  // sentence is not a second reveal, and the player should not be able to buy
  // the panel into repeating itself.
  //
  // Last in panel order on purpose: the reveal is about a step that has not
  // happened, so it reads as a glimpse past the end of the list rather than as
  // another factor bearing on this roll (it carries no delta and draws no pips).
  const revealsNextDemand = (activeAction.activeNudges ?? []).some(
    (id) => authored.find((n) => n.id === id)?.reveals === 'next_step_demand',
  );
  if (revealsNextDemand) {
    const line = deriveWhisperRevealLine({
      nextStep: readNextStepDemand(
        template, activeAction.currentStep,
        (next) => fightInputsForForecast(gameState, activeAction, next, template),
      ),
      difficultyWord,
    });
    factors.push({
      id: line.id,
      text: enrich(line.text),
      polarity: line.polarity,
      source: line.source,
    });
  }

  // ── Motive ──────────────────────────────────────────────────────
  // Fail-soft: any throw inside classification renders CHANCE with the generic
  // sentence rather than losing the header (plan's fail-soft table).
  let motive: EncounterStageNudgePhaseModel['motive'];
  try {
    const receipt = readMotiveReceipt(graph.getNode(actorId)?.properties);
    const source = classifyMotive(receipt, {
      playerSourced: activeAction.source === 'player',
    });
    motive = {
      source,
      chipLabel: MOTIVE_CHIP_LABELS[source],
      sentence: MOTIVE_FALLBACK_SENTENCES[source],
    };
  } catch {
    motive = {
      source: 'chance',
      chipLabel: MOTIVE_CHIP_LABELS.chance,
      sentence: MOTIVE_FALLBACK_SENTENCES.chance,
    };
  }

  const committedIds = [...(activeAction.activeNudges ?? [])];

  // THR-1706 — who pays. A sphere-less card bills the god's primary first
  // (`spendNudgeEssence`), and the commit path reads `budgetSphere` off this
  // model, so the name on the card and the pool that is charged cannot drift.
  const budgetSphere = identity?.sphereAlignment?.primary;
  // THR-2206 — each pool's refill band, in the essence bar's own words, so a
  // card greyed for want of essence names its short pool and how fast it
  // refills. `readEssenceRefill` is fail-soft (an empty reading ⇒ bare reasons).
  const refill = budgetSphere && gameState?.ascendantId
    ? readEssenceRefill(graph, gameState.ascendantId, gameState.controlEffects)
    : undefined;
  // THR-2208 — a card paid in a Mandate sphere, for a mortal bound to the god, counts
  // toward the Mandate when the chapter closes. Every band credits something, so the
  // hint never promises what the close will not do (Law 56).
  const mandateSpheres = mandateDeedSpheres(gameState, graph, actorId);
  const pricedCards = cards.map((card) => {
    const payingSphere = card.sphere ?? budgetSphere;
    if (!payingSphere) return card;
    const mandateHint = card.essenceCost > 0 && mandateSpheres.has(payingSphere) ? MANDATE_CARD_HINT : undefined;
    const costNote = nudgeCostNote(card, budgetSphere);
    // Identity runs only (`budgetSphere` set): a legacy run keeps the generic reason.
    const shortSphere = budgetSphere ? nudgeShortSphere(card, budgetSphere) : undefined;
    const shortReason = shortSphere
      ? essenceShortReason(shortSphere, card.sphere !== undefined, refill?.spheres[shortSphere]?.band)
      : undefined;
    const short = card.state === 'dimmed' && card.blockedCode === 'essence_unavailable' && shortReason;
    return {
      ...card,
      payingSphere,
      ...(costNote ? { costNote } : {}),
      ...(mandateHint ? { mandateHint } : {}),
      ...(shortReason ? { essenceShortReason: shortReason } : {}),
      ...(short ? { blockedReason: shortReason, shortSphere } : {}),
    };
  });
  // THR-1858 — each paying sphere's own pool, for the footer's per-sphere line.
  const payingSphereEssence: Partial<Record<SphereName, number>> = {};
  for (const card of pricedCards) {
    if (card.payingSphere && !(card.payingSphere in payingSphereEssence)) {
      payingSphereEssence[card.payingSphere] = availableEssenceFor(card.payingSphere);
    }
  }

  return {
    actionId: activeAction.actionId,
    templateId: template.id,
    stepIndex: activeAction.currentStep,
    motive,
    testPanel: {
      reach: stepReach,
      reachLabel: stepReach.charAt(0).toUpperCase() + stepReach.slice(1),
      purposeLine: step.purposeLine != null ? enrich(step.purposeLine) : undefined,
      difficultyWord: difficultyWord(effectiveDifficulty),
      difficultyValue: effectiveDifficulty,
      factors,
      ...(skill ? { skill } : {}),
    },
    baseForecast,
    forecastInput,
    ...(forecastScale ? { forecastScale } : {}),
    traitModifierTotal,
    cards: pricedCards,
    withheld,
    committedIds,
    // The pooled total across every sphere, deliberately NOT the home-sphere sum
    // (THR-2201 review): `useNudgeHand` subtracts *every* selected card from this
    // as its overall guard, gated cards of unbought spheres included, so narrowing
    // it dimmed an Order card the Order pool could pay. The home-sphere reach for a
    // sphere-less card is enforced by `buildNudgeHand` (above), the budget-sphere
    // check in the hook, and `payableSpheres` at commit.
    availableEssence: essenceReader(pool)(undefined),
    // `accessibleSpheres` threaded through for the same reason the card models
    // quote the effective price: omitting it re-quotes a discounted hand at its
    // authored cost, so a reopened stage would report a total the commit path
    // never charged (THR-890).
    // THR-1247 — the *composed* step: a committed dealt card must be billed like
    // any other, and `totalNudgeCost` prices by looking the id up in `nudges`.
    // Reading the authored step here would show a dealt card's price on its face
    // and then charge nothing for it.
    committedCost: totalNudgeCost(composedStep, committedIds, discountSpheres, NUDGE_ESSENCE_COST_SCALE),
    ...(budgetSphere
      ? { budgetSphere, budgetSphereEssence: availableEssenceFor(budgetSphere) }
      : {}),
    ...(Object.keys(payingSphereEssence).length > 0 ? { payingSphereEssence } : {}),
    // THR-2201 — the pools a sphere-less card may be charged from at commit.
    ...(homeSpheres.length > 0 ? { payableSpheres: homeSpheres } : {}),
  };
}
