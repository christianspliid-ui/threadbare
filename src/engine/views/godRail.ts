/**
 * godRail — the god rail's view model (THR-1894, frame plan § E2, § F6).
 *
 * What the left rail shows, top to bottom: who the god is (identity, the quintessence
 * line while it has fallen, The First once bonded), what it holds (essence, the seat,
 * Attention), what it can cast (the hand: Move, Investiture and every revealed god
 * card, each priced at par), and the folded rows' one-line summaries.
 *
 * It composes the god's sheet selectors (`subjects/godSheet.ts`), so the rail and the
 * god's own page cannot disagree, and it prices through `dominionScaledEssenceCost`,
 * the one god-card price table the cast path charges from (PC-6).
 *
 * **The hand's two prices.** A row has no target, so it shows the **par** price
 * (`DOMINION_PAR_BAND`, Foreign ground) and says so in its tooltip. Whether the row
 * dims is measured at the **sovereign** price, the cheapest the card can cost
 * anywhere, against the pool that pays it: a card the god can cast somewhere is never
 * shown as uncastable (Law 25).
 *
 * Pure and deterministic; no PRNG. A build that throws returns the fallback (an empty
 * rail) through `readView`.
 */
import type { ViewSelector } from './readView';
import type { GameState } from '../../types/gameState';
import type { SphereName } from '../../types';
import { SPHERE_NAMES } from '../../types';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import type { AscendantArchetype } from '../../types/influence';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { isActionRevealed } from '../actionUnlock';
import { playerFacingTemplateName } from '../unifiedActionResolution';
import { dominionScaledCost, dominionScaledEssenceCost } from '../dominion';
import { getAttentionVisualState } from '../attentionPool';
import { ATTENTION_BASE_CAPACITY, ATTENTION_BASE_REGEN } from '../../data/attention-constants';
import { DOMINION_BAND_LINES, DOMINION_BAND_WORDS, DOMINION_PAR_BAND } from '../../data/dominion-content';
import { DOMINION_CAST_CLAUSE } from '../../data/dominion-ui-content';
import { MANDATE_TREND_WORD } from '../../data/ascendant-bar-content';
import { essencePriceLabel, sphereWord } from '../../data/essence-format';
import {
  GOD_RAIL_ROW_SUMMARIES,
  GOD_RAIL_SUMMARY_MAX_CH,
  HAND_PRICE_TIER_SCALED,
  HAND_PRICE_TOOLTIP,
  HAND_UNPAYABLE_REASON,
  countWords,
} from '../../data/frame-content';
import { getFirstId } from '../meetingEncounter';
import { payingSphere } from '../targetActions';
import {
  selectAscendantIdentityView,
  selectCovenantRows,
  selectEssenceRows,
  selectHomeSeat,
  selectMandateRow,
  selectQuintessenceView,
  selectReachRows,
  selectSignaturePaths,
  type AscendantIdentityView,
  type CovenantRowView,
  type EssenceRowView,
  type HomeSeatView,
  type MandateRowView,
  type QuintessenceView,
  type ReachRowView,
  type SignaturePathView,
} from './subjects/godSheet';
import type { GodRailSectionId } from '../../data/frame-registry';

// ─── Shapes ──────────────────────────────────────────────────────────

export interface GodRailArgs {
  primarySphere: SphereName;
  secondarySphere: SphereName;
  archetypeTitle: string;
  avatarName: string;
  /** The Hooks row's count, counted by the block's own walk (`countHooks`) so the two agree. */
  hookCount: number;
  /**
   * The state the rail reads that some writers change without `touchWorld` (a cast while
   * the clock is held spends essence through `setGameState`), in the cache key only —
   * the THR-1893 review-gate lesson. Built by {@link godRailStamp}.
   */
  stamp?: string;
}

export interface GodRailFirst {
  id: string;
  name: string;
}

export interface GodRailIdentity {
  view: AscendantIdentityView;
  quintessence: QuintessenceView;
  /** The bonded First, or null before the bond (Law 56: the line renders only while true). */
  first: GodRailFirst | null;
}

export type AttentionState = 'focused' | 'busy' | 'strained' | 'overwhelmed';

export interface GodRailAttention {
  state: AttentionState;
  /** The state word; empty while focused (the focused state has no word). */
  word: string;
  /** The gauge's fill, 0–1. Drawn as a bar, never printed. */
  fill: number;
  /** The pool balance and its cap, for the meter's tooltip (Law 13's pool-balance exception). */
  pool: number;
  capacity: number;
}

export interface HandCardVM {
  id: string;
  name: string;
  /** The card's own description, for the row's hover. */
  description: string;
  /** The pool that pays: `sphereAffinity ?? the god's primary sphere` (the cast path's rule). */
  paySphere: SphereName;
  paySphereWord: string;
  /** The par price through `essencePriceLabel` — "Free" for 0. */
  parPriceLabel: string;
  /** "Life · 2 essence", or "Free" alone when no pool pays. */
  line2: string;
  /** `ui.hand_price`'s description, built from the par band's line and the cast clause; null when free. */
  priceTooltip: string | null;
  /** The pool can pay the card's cheapest (sovereign) price. A free card is always payable. */
  payable: boolean;
  /** "Not enough Life essence", or null while payable. */
  reason: string | null;
  /** The card's Codex entry id (action entries are the bare template id). */
  codexEntryId: string;
}

export interface GodRailHand {
  coreVerbs: ('move' | 'investiture')[];
  cards: HandCardVM[];
  /** The sphere order the hand sorts and groups by: the essence block's order. */
  sphereOrder: SphereName[];
}

export interface GodRailRow {
  id: GodRailSectionId;
  renders: boolean;
  summary: string;
}

export interface GodRailBodies {
  reaches: ReachRowView[];
  mandate: MandateRowView | null;
  covenants: CovenantRowView[];
  signatures: SignaturePathView[];
}

export interface GodRailVM {
  identity: GodRailIdentity | null;
  essence: { rows: EssenceRowView[]; primary: SphereName | null; seat: HomeSeatView | null };
  attention: GodRailAttention;
  hand: GodRailHand;
  rows: Record<'reaches' | 'mandate' | 'covenants' | 'signatures' | 'hooks', GodRailRow>;
  bodies: GodRailBodies;
}

// ─── The hand ────────────────────────────────────────────────────────

/** A god card: every affinity is the ascendant (the tray's own predicate, THR-184). */
export function isGodCard(t: Pick<UnifiedActionTemplate, 'actorAffinities'>): boolean {
  return (t.actorAffinities?.length ?? 0) > 0 && t.actorAffinities!.every((a) => a === 'ascendant');
}

/** The essence block's order: the god's spheres first, then the canonical order. */
export function handSphereOrder(primary: SphereName, secondary: SphereName): SphereName[] {
  const identity: SphereName[] = primary === secondary ? [primary] : [primary, secondary];
  return [...identity, ...SPHERE_NAMES.filter((s) => !identity.includes(s))];
}

function lowerFirst(s: string): string {
  return s.length > 0 ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

/**
 * `ui.hand_price`'s description: the par band's own name and line, then the sovereign
 * and hostile cast clauses word for word; a tier-scaled card adds that a rarer target
 * costs more. Built at render so retuning the band words can never make it false.
 */
export function handPriceTooltipDesc(tierScaled: boolean): string {
  const base = HAND_PRICE_TOOLTIP
    .replace('{par}', DOMINION_BAND_WORDS[DOMINION_PAR_BAND])
    .replace('{parLine}', lowerFirst(DOMINION_BAND_LINES[DOMINION_PAR_BAND]))
    .replace('{sovereign}', DOMINION_CAST_CLAUSE.sovereign ?? '')
    .replace('{hostile}', DOMINION_CAST_CLAUSE.hostile ?? '');
  return tierScaled ? `${base} ${HAND_PRICE_TIER_SCALED}` : base;
}

/** One hand row, priced at par and judged payable at the sovereign price. */
export function buildHandCard(
  state: GameState,
  template: UnifiedActionTemplate,
  primarySphere: SphereName,
): HandCardVM {
  const paySphere = payingSphere(template, primarySphere);
  const paySphereWord = sphereWord(paySphere);
  const par = dominionScaledEssenceCost(state.graph, state.ascendantId, template, undefined);
  const sovereign = dominionScaledCost(par.base, 'sovereign');
  const pool = (state.essencePool as Record<string, number> | undefined)?.[paySphere] ?? 0;
  const free = par.cost === 0;
  const payable = sovereign <= 0 || pool >= sovereign;
  const parPriceLabel = essencePriceLabel(par.cost);
  return {
    id: template.id,
    // The gift modal and the cast drawer print the spell name; the rail must too (THR-1979).
    name: playerFacingTemplateName(template),
    description: template.description ?? '',
    paySphere,
    paySphereWord,
    parPriceLabel,
    line2: free ? parPriceLabel : `${paySphereWord} · ${parPriceLabel}`,
    priceTooltip: free ? null : handPriceTooltipDesc(template.essenceCostContext === 'target_tier_scaled'),
    payable,
    reason: payable ? null : HAND_UNPAYABLE_REASON.replace('{sphere}', paySphereWord),
    codexEntryId: template.id,
  };
}

/** Every revealed god card, sorted by paying sphere (essence order), then name. */
export function buildHandCards(
  state: GameState,
  primary: SphereName,
  secondary: SphereName,
  templates: readonly UnifiedActionTemplate[] = UNIFIED_ACTION_TEMPLATES,
): HandCardVM[] {
  const order = handSphereOrder(primary, secondary);
  const rank = (s: SphereName) => {
    const i = order.indexOf(s);
    return i < 0 ? order.length : i;
  };
  return templates
    .filter((t) => isGodCard(t) && isActionRevealed(t, state.unlockedActionIds))
    .map((t) => buildHandCard(state, t, primary))
    .sort((a, b) => rank(a.paySphere) - rank(b.paySphere) || a.name.localeCompare(b.name));
}

// ─── Folded rows ─────────────────────────────────────────────────────

/** "Veil · Thinning", or the tier word alone past {@link GOD_RAIL_SUMMARY_MAX_CH}. */
export function reachSummary(reachLabel: string, tierWord: string): string {
  const full = GOD_RAIL_ROW_SUMMARIES.reaches.replace('{reach}', reachLabel).replace('{tier}', tierWord);
  return full.length <= GOD_RAIL_SUMMARY_MAX_CH ? full : tierWord;
}

/** The Mandate row's word — the same table the opened block reads. */
export function mandateSummary(mandate: MandateRowView | null): string {
  if (!mandate) return '';
  return MANDATE_TREND_WORD[mandate.trend] ?? MANDATE_TREND_WORD.steady;
}

// ─── Attention ───────────────────────────────────────────────────────

const ATTENTION_WORD: Record<AttentionState, string> = {
  focused: '',
  busy: 'Busy',
  strained: 'Strained',
  overwhelmed: 'Overwhelmed',
};

function readAttention(state: GameState): GodRailAttention {
  const props = state.graph.getNode(state.ascendantId)?.properties ?? {};
  const pool = Number.isFinite(props.attentionPool as number) ? (props.attentionPool as number) : ATTENTION_BASE_CAPACITY;
  const capacity = Number.isFinite(props.attentionCapacity as number) ? (props.attentionCapacity as number) : ATTENTION_BASE_CAPACITY;
  const regen = Number.isFinite(props.attentionRegen as number) ? (props.attentionRegen as number) : ATTENTION_BASE_REGEN;
  const visual = getAttentionVisualState({ attentionPool: pool, attentionCapacity: capacity, attentionRegen: regen });
  const fill = capacity > 0 ? Math.max(0, Math.min(1, pool / capacity)) : 0;
  return { state: visual, word: ATTENTION_WORD[visual], fill, pool, capacity };
}

// ─── Build ───────────────────────────────────────────────────────────

/** The state the rail reads that can move without `touchWorld`; cache key only. */
export function godRailStamp(state: GameState): string {
  const pool = state.essencePool ?? {};
  const essence = Object.keys(pool).sort().map((k) => `${k}:${Math.floor(((pool as Record<string, number>)[k] ?? 0) * 100)}`).join(',');
  const asc = state.graph.getNode(state.ascendantId)?.properties ?? {};
  return [
    essence,
    state.unlockedActionIds?.length ?? -1,
    (state.unifiedActions ?? []).length,
    (state.pendingControlReleases ?? []).length,
    Math.round(((asc.attentionPool as number) ?? 0) * 100),
    state.mandateState?.currentStage ?? '',
    Math.round((state.mandateState?.progress ?? 0) * 100),
  ].join('|');
}

export function buildGodRail(state: GameState, rawArgs: GodRailArgs): GodRailVM {
  // Fail-soft (NFP #4): a caller that passes no archetype (the debug bridge, a fixture)
  // gets the canonical first sphere, never an undefined key in the model.
  const primarySphere = (SPHERE_NAMES as readonly string[]).includes(rawArgs?.primarySphere) ? rawArgs.primarySphere : SPHERE_NAMES[0];
  const secondarySphere = (SPHERE_NAMES as readonly string[]).includes(rawArgs?.secondarySphere) ? rawArgs.secondarySphere : primarySphere;
  const args: GodRailArgs = {
    primarySphere,
    secondarySphere,
    archetypeTitle: rawArgs?.archetypeTitle ?? '',
    avatarName: rawArgs?.avatarName ?? '',
    hookCount: rawArgs?.hookCount ?? 0,
  };
  const archetype = {
    title: args.archetypeTitle,
    sphereAlignment: { primary: args.primarySphere, secondary: args.secondarySphere },
  } as AscendantArchetype;

  const view = selectAscendantIdentityView(state, archetype, args.avatarName);
  const quintessence = selectQuintessenceView(state);
  const firstId = getFirstId(state.graph, state.ascendantId);
  const firstNode = firstId ? state.graph.getNode(firstId) : undefined;

  const reaches = selectReachRows(state);
  const mandate = selectMandateRow(state);
  const covenants = selectCovenantRows(state);
  const signatures = selectSignaturePaths(state);
  // Count = the god's own paths; the not-this-incarnation paths are context (THR-613).
  const yourSignatures = signatures.filter((p) => p.state !== 'locked_incarnation').length;
  const primaryReach = reaches.find((r) => r.rank === 'primary') ?? reaches[0];
  const hookCount = Number.isFinite(args.hookCount) ? Math.max(0, Math.floor(args.hookCount)) : 0;

  return {
    identity: {
      view,
      quintessence,
      first: firstId && firstNode ? { id: firstId, name: firstNode.name ?? firstId } : null,
    },
    essence: {
      rows: selectEssenceRows(state, archetype),
      primary: args.primarySphere,
      seat: selectHomeSeat(state),
    },
    attention: readAttention(state),
    hand: {
      coreVerbs: ['move', 'investiture'],
      cards: buildHandCards(state, args.primarySphere, args.secondarySphere),
      sphereOrder: handSphereOrder(args.primarySphere, args.secondarySphere),
    },
    rows: {
      reaches: { id: 'reaches', renders: true, summary: primaryReach ? reachSummary(primaryReach.label, primaryReach.tierWord) : '' },
      mandate: { id: 'mandate', renders: true, summary: mandateSummary(mandate) },
      covenants: { id: 'covenants', renders: covenants.length > 0, summary: countWords(covenants.length, GOD_RAIL_ROW_SUMMARIES.covenants) },
      signatures: { id: 'signatures', renders: yourSignatures > 0, summary: countWords(yourSignatures, GOD_RAIL_ROW_SUMMARIES.signatures) },
      hooks: { id: 'hooks', renders: hookCount > 0, summary: countWords(hookCount, GOD_RAIL_ROW_SUMMARIES.hooks) },
    },
    bodies: { reaches, mandate, covenants, signatures },
  };
}

/** An empty rail: no identity, no cards, every optional row absent. Plain data. */
export function emptyGodRail(): GodRailVM {
  const row = (id: GodRailRow['id'], renders: boolean): GodRailRow => ({ id, renders, summary: '' });
  return {
    identity: null,
    essence: { rows: [], primary: null, seat: null },
    attention: { state: 'focused', word: '', fill: 1, pool: ATTENTION_BASE_CAPACITY, capacity: ATTENTION_BASE_CAPACITY },
    hand: { coreVerbs: ['move', 'investiture'], cards: [], sphereOrder: [] },
    rows: {
      reaches: row('reaches', true),
      mandate: row('mandate', true),
      covenants: row('covenants', false),
      signatures: row('signatures', false),
      hooks: row('hooks', false),
    },
    bodies: { reaches: [], mandate: null, covenants: [], signatures: [] },
  };
}

export const godRailSelector: ViewSelector<GodRailArgs, GodRailVM> = {
  id: 'godRail',
  invalidation: 'world',
  key: (a) => `${a?.primarySphere ?? ''}|${a?.secondarySphere ?? ''}|${a?.archetypeTitle ?? ''}|${a?.avatarName ?? ''}|${a?.hookCount ?? 0}|${a?.stamp ?? ''}`,
  build: (ctx, a) => buildGodRail(ctx.state, a),
  fallback: () => emptyGodRail(),
};
