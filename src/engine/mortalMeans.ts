// src/engine/mortalMeans.ts
//
// THR-1936 S1 — a mortal's Means: every mortal who makes choices is born with some, and
// the money encounters they take pay or cost them by how the dice fall.
// Plan: Docs/plans/2026-10-15-thr-1936-mortal-wealth.md § Systems design 1–3.
//
// Pure helpers over the graph and the wealth funnel (`bankWealth`). The outcome-table
// application lives in the resolution (`unifiedActionResolution.ts`); the `economy_shift`
// case lives in the aftermath executor (`encounterAftermath.ts`). Both call in here, so
// the scaling, the default reasons and the aftermath change's words have one home.

import type { WorldGraph } from './graph';
import type {
  AftermathVariant,
  EncounterAftermathChange,
  EncounterAftermathReactionEffect,
  UnifiedActionOutcome,
  UnifiedActionTemplate,
} from '../types/unifiedAction';
import { isAutonomousDecisionActor } from './decisionTier';
import { DEFAULT_WEALTH, ROLE_WEALTH } from './npcGraduation';
import { getProsperityTier, type ProsperityTier } from './phaseProsperity';
import { resolveToParentLocation } from './sublocationShape';
import { getAgentLocationId } from './graphQueries';
import { bankWealth, getWealthTier, readWealth, type WealthTier } from './wealth';
import { emitTrace } from './traceBuffer';
import {
  MEANS_BIRTH_HOME_SHIFT,
  MEANS_POOR_LINE,
  MEANS_POOR_LOSS_SCALE,
  MORTAL_MEANS_ENABLED,
} from '../data/mortal-means-constants';

/** The tooltip that explains an `economy` aftermath change's title (Law 1). */
export const MEANS_CHANGE_TOOLTIP_ID = 'ui.econ.means.change';

// ─── 1. Born with Means ──────────────────────────────────────────────────────

/** The prosperity tier of the settlement a mortal stands in, or null when none reads. */
function homeProsperityTier(graph: WorldGraph, agentId: string): ProsperityTier | null {
  const locId = getAgentLocationId(graph, agentId);
  const home = resolveToParentLocation(graph, locId ? graph.getNode(locId) : undefined);
  const prosperity = home?.properties?.prosperity;
  return typeof prosperity === 'number' && Number.isFinite(prosperity)
    ? getProsperityTier(prosperity)
    : null;
}

/** What a decider is born with: role wealth plus their home town's shift, clamped 0–100. */
export function birthMeansFor(role: string | undefined, homeTier: ProsperityTier | null): number {
  const base = (role ? ROLE_WEALTH[role] : undefined) ?? DEFAULT_WEALTH;
  const shift = homeTier ? MEANS_BIRTH_HOME_SHIFT[homeTier] ?? 0 : 0;
  return Math.max(0, Math.min(100, base + shift));
}

/**
 * Give every autonomous decider without `wealth` the Means of their walk of life.
 * Runs once at the end of world creation. Deterministic (no PRNG); a node that already
 * carries `wealth` is left alone, so the pass is idempotent. `skipIds` holds the avatars:
 * the player drives them, and they are not deciders.
 *
 * Promotion to the spotlight already stamps role wealth (`hydrateToTier`), so a mortal
 * promoted mid-run never reaches the board without Means either.
 *
 * @returns how many deciders were given Means.
 */
export function ensureDeciderMeans(
  graph: WorldGraph,
  tick: number,
  skipIds: ReadonlySet<string> = new Set(),
): number {
  if (!MORTAL_MEANS_ENABLED) return 0;
  let born = 0;
  for (const node of graph.getNodesByType('actor')) {
    if (skipIds.has(node.id)) continue;
    if (giveBirthMeans(graph, node.id, tick)) born++;
  }
  return born;
}

/**
 * Give one decider without `wealth` the Means of their walk of life. For a mortal minted
 * after world creation — The First bonded at the meeting, the dev-seeded First — whose
 * mint runs after the world-creation pass. Idempotent; a no-op for a non-decider.
 *
 * @returns true when Means was written.
 */
export function giveBirthMeans(graph: WorldGraph, agentId: string, tick: number): boolean {
  if (!MORTAL_MEANS_ENABLED) return false;
  const node = graph.getNode(agentId);
  if (!node || node.type !== 'actor') return false;
  if (!isAutonomousDecisionActor(node)) return false;
  if (node.properties.wealth !== undefined) return false;
  const role = typeof node.properties.npcRole === 'string' ? node.properties.npcRole : undefined;
  const homeTier = homeProsperityTier(graph, node.id);
  const wealth = birthMeansFor(role, homeTier);
  node.properties.wealth = wealth;
  node.properties.lastWealthReason = 'birth';
  emitTrace({
    tick,
    category: 'economy.means.birth',
    agentId: node.id,
    role: role ?? null,
    homeTier,
    wealth,
    summary: `${node.name} is born with Means ${wealth} (${role ?? 'no role'}, home ${homeTier ?? 'none'})`,
  });
  return true;
}

// ─── 2. The outcome table ────────────────────────────────────────────────────

/**
 * The band's effects: the resolved variant's table when it authors one, else the
 * template's (plan § Resolution 3). Empty when neither names the band.
 */
export function selectOutcomeEffects(
  template: Pick<UnifiedActionTemplate, 'outcomeEffects'>,
  variant: Pick<AftermathVariant, 'outcomeEffects'> | undefined,
  outcome: UnifiedActionOutcome,
): readonly EncounterAftermathReactionEffect[] {
  const table = variant?.outcomeEffects ?? template.outcomeEffects;
  return table?.[outcome] ?? [];
}

/**
 * Does this template's table pay its actor on a success? The S2 want reads it to decide
 * what counts as paying work (Law 42: content decides).
 */
export function templatePaysActorOnSuccess(template: Pick<UnifiedActionTemplate, 'outcomeEffects'>): boolean {
  const effects = template.outcomeEffects?.success ?? [];
  return effects.some(e =>
    e.kind === 'economy_shift'
    && e.quantity === 'means'
    && e.amount > 0
    && (e.targetAgentId === undefined || e.targetAgentId === '$actor'),
  );
}

// ─── 3. economy_shift on 'means' ─────────────────────────────────────────────

/** The source-phrase key a shift stamps when the author named none. */
export function defaultMeansReason(amount: number, encounterType: string | undefined): string {
  if (encounterType === 'trade') return amount >= 0 ? 'trade_success' : 'trade_failure';
  if (amount >= 0) {
    if (encounterType === 'steal') return 'theft';
    if (encounterType === 'hire') return 'paid_work';
    return 'venture_gain';
  }
  return 'venture_loss';
}

/** A loss on a mortal below Getting by is scaled down; a gain is never scaled. */
export function scaledMeansAmount(currentWealth: number, amount: number): number {
  return amount < 0 && currentWealth < MEANS_POOR_LINE ? amount * MEANS_POOR_LOSS_SCALE : amount;
}

export interface MeansShiftResult {
  readonly wealthBefore: number;
  readonly wealthAfter: number;
  readonly amount: number;
  readonly bandBefore: WealthTier;
  readonly bandAfter: WealthTier;
  readonly reason: string;
}

/**
 * Bank one shift on a mortal's property bag: the poor-loss scale, then `bankWealth`
 * (which clamps 0–100 and stamps the reason). Returns null — and writes nothing — when
 * Means is switched off or the clamp left wealth where it was (Law 56: no change chip
 * for a move that did not happen).
 */
export function applyMeansShift(
  properties: Record<string, unknown>,
  amount: number,
  reason: string,
): MeansShiftResult | null {
  if (!MORTAL_MEANS_ENABLED) return null;
  if (!Number.isFinite(amount) || amount === 0) return null;
  const current = readWealth(properties);
  const scaled = scaledMeansAmount(current, amount);
  const after = Math.max(0, Math.min(100, current + scaled));
  if (after === current) return null;
  const { previousWealth, newWealth } = bankWealth(properties, scaled, reason);
  return {
    wealthBefore: previousWealth,
    wealthAfter: newWealth,
    amount: scaled,
    bandBefore: getWealthTier(previousWealth),
    bandAfter: getWealthTier(newWealth),
    reason,
  };
}

/**
 * The aftermath change's sentence (plan § UI pillar): a crossed band names the new
 * word; a move inside a band names only the direction. Never an amount (Law 13).
 * An empty name falls back to the pronoun and draws no link.
 */
export function meansChangeSentence(
  name: string | undefined,
  shift: Pick<MeansShiftResult, 'wealthBefore' | 'wealthAfter' | 'bandBefore' | 'bandAfter'>,
): { title: string; detail: string; polarity: 'gain' | 'loss' } {
  const gained = shift.wealthAfter > shift.wealthBefore;
  const who = name && name.trim().length > 0 ? name : undefined;
  if (shift.bandAfter !== shift.bandBefore) {
    return {
      title: gained ? 'Better off' : 'Worse off',
      detail: who ? `${who} is now ${shift.bandAfter}.` : `They are now ${shift.bandAfter}.`,
      polarity: gained ? 'gain' : 'loss',
    };
  }
  const tail = gained ? 'a little richer' : 'a little poorer';
  return {
    title: gained ? 'Fortunes turn up' : 'Fortunes turn down',
    detail: who ? `${who} comes away ${tail}.` : `They come away ${tail}.`,
    polarity: gained ? 'gain' : 'loss',
  };
}

/** Build the `economy` aftermath change for one shift. */
export function buildMeansChange(
  id: string,
  agentId: string,
  name: string | undefined,
  shift: MeansShiftResult,
  actorId: string | undefined,
): EncounterAftermathChange {
  const words = meansChangeSentence(name, shift);
  const who = name && name.trim().length > 0 ? name : undefined;
  return {
    id,
    kind: 'economy',
    title: words.title,
    detail: words.detail,
    polarity: words.polarity,
    actorId: actorId ?? agentId,
    actorName: who,
    category: words.polarity === 'gain' ? 'boon' : 'scar',
    direction: words.polarity,
    stateNoun: { text: 'Means', tooltipId: MEANS_CHANGE_TOOLTIP_ID },
    // Law 21: the mortal's name routes to their sheet.
    ...(who ? { concepts: [{ text: who, entityId: agentId, visualKind: 'agent' as const }] } : {}),
    ...(actorId && actorId !== agentId ? { subjectId: agentId } : {}),
  };
}

/** The debug bridge's read of one mortal's Means (S1: no want yet). */
export function readMortalMeans(
  graph: WorldGraph,
  agentId: string,
): { wealth: number; band: WealthTier; lastReason: string | null; want: null } | null {
  const node = graph.getNode(agentId);
  if (!node || node.type !== 'actor') return null;
  const props = node.properties as Record<string, unknown>;
  const wealth = readWealth(props);
  const lastReason = typeof props.lastWealthReason === 'string' ? props.lastWealthReason : null;
  return { wealth, band: getWealthTier(wealth), lastReason, want: null };
}
