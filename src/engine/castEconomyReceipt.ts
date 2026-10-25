/**
 * Every economic card says what it changed (THR-1968, god's stake S2).
 *
 * Plan: `Docs/plans/2026-10-17-thr-1935-the-gods-stake-in-the-economy.md` § Engine 6.
 * The cast receipt (`castTargetChanges.ts`) reads its target before a step's ops and
 * diffs it after. This module is the economy half of that snapshot and that diff:
 *
 * - **A settlement** (the target, or the place a sublocation target belongs to): its
 *   prosperity word (`getProsperityTier`, the Fortunes row's own word), the unrest band
 *   it wears as a chip (the location traits, so the receipt agrees with the page), the
 *   stock tier of each staple, and the `trades_with` lanes touching it (threatened, volume).
 * - **A mortal**: their Means band (`getWealthTier`).
 *
 * For each quantity a **crossed band** gives one `economy` change with `crossed: true`
 * and the new word; a **move inside a band** gives one with `crossed: false` and only
 * the direction; an unchanged quantity gives nothing (Law 56). `decidePresentation`
 * opens the receipt dialog on a crossed target-side change.
 *
 * Every part is optional and a field it cannot read is left out (NFP #4). Pure and
 * deterministic (NFP #3): reads the graph, never writes, no PRNG.
 *
 * **Staple tiers are derived here, not read from the stored `stockTier`.** The stored
 * tier is refreshed by the stock-tier phase, after the cast; reading it would make a
 * Bless the Harvest that filled a granary say nothing. Both snapshots use the same
 * derivation (`deriveLocationStockTiers`, with the embargo cut read through the realm
 * map the stock-tier phase reads). A row is written only when the cast changed the good's quantity, and only
 * when the derivation before the cast agrees with the stored tier the page shows, so the
 * receipt never reports a tier the cast did not move or the page would contradict.
 */

import type { WorldGraph } from './graph';
import type { EncounterAftermathChange } from '../types/unifiedAction';
import type { StockTier } from '../types/resource';
import { getProsperityTier, type ProsperityTier } from './phaseProsperity';
import { resolveToParentLocation } from './sublocationShape';
import { getSublocationsAt } from './graphQueries';
import { deriveLocationStockTiers, readResources } from './resourceEconomy';
import { getResourceClass } from '../data/resource-classes';
import { embargoCutsByLocation } from './regionalMonopoly';
import { REGIONAL_MONOPOLY_ENABLED, EMBARGO_BALANCE_CUT } from '../data/regional-monopoly-constants';
import { RESOURCE_DEFINITIONS } from '../data/resource-content';
import {
  LOCATION_TRAIT_IDS,
  LOCATION_TRAIT_LAWLESS_RELEASE,
  LOCATION_TRAIT_RESTLESS_RELEASE,
  ON_THE_EDGE_RELEASE,
} from '../data/location-trait-constants';
import { getWealthTier, readWealth, type WealthTier } from './wealth';
import { meansChangeSentence, MEANS_CHANGE_TOOLTIP_ID } from './mortalMeans';
import {
  ECONOMY_RECEIPTS_ENABLED,
  ECONOMY_RECEIPT_LINES,
  ECONOMY_RECEIPT_NOUNS,
  ECONOMY_RECEIPT_UP_IS_GAIN,
  ECONOMY_STAPLE_PLENTY_LINES,
  ECONOMY_STOCK_ORDER,
  ECONOMY_UNREST_BAND_ORDER,
  ECONOMY_UNREST_BAND_WORDS,
  fillEconomyReceiptLine,
  prosperityReceiptWord,
  LAND_SHOCK_RECEIPT_LINES,
  LAND_SHOCK_WHERE_WORDS,
  type EconomyReceiptDirection,
  type EconomyReceiptLine,
  type EconomyReceiptQuantity,
  type EconomyUnrestBand,
} from '../data/economy-receipt-content';
import { readLandShocks, type GodLandShockSource } from './settlementEconomy/shocks';

// ─── Snapshot ────────────────────────────────────────────────────────────────

export interface EconomyLaneSnapshot {
  readonly threatened: boolean;
  readonly volume: number;
}

export interface EconomyStapleSnapshot {
  readonly tier: StockTier;
  readonly quantity: number;
  /** The tier the stock-tier phase last stored (what the town page shows), when one is. */
  readonly storedTier?: StockTier;
}

/** The economy part of a cast snapshot. Every field is optional (a field it cannot read is left out). */
export interface CastEconomySnapshot {
  /** The settlement the reading is of (the target, or its parent place). */
  readonly settlementId?: string;
  readonly settlementName?: string;
  readonly prosperity?: number;
  readonly prosperityTier?: ProsperityTier;
  readonly unrest?: number;
  /** The worst unrest chip the town wears, or null when it wears none. */
  readonly unrestBand?: EconomyUnrestBand | null;
  /** Staple goods, by resource id. */
  readonly staples?: ReadonlyMap<string, EconomyStapleSnapshot>;
  /** `trades_with` lanes touching the settlement, by edge id. */
  readonly lanes?: ReadonlyMap<string, EconomyLaneSnapshot>;
  /** THR-1923 — the settlement economy's land shocks, keyed `source:startTick`. */
  readonly landShocks?: ReadonlyMap<string, { readonly source: GodLandShockSource; readonly direction?: string }>;
  /** A mortal's Means. */
  readonly wealth?: number;
  readonly meansBand?: WealthTier;
}

function finite(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

/** The number below which the location-trait phase releases each unrest chip. */
const UNREST_BAND_RELEASE: Record<EconomyUnrestBand, number> = {
  restless: LOCATION_TRAIT_RESTLESS_RELEASE,
  lawless: LOCATION_TRAIT_LAWLESS_RELEASE,
  on_the_edge: ON_THE_EDGE_RELEASE,
};

/**
 * The worst unrest chip the town wears **that its number still holds**. The chips are
 * minted and released by the daily location-trait phase, after the cast, so a cast that
 * drops unrest below a chip's release line would otherwise read as no crossing at all.
 * A chip whose release line the number has fallen below counts as gone: the next trait
 * pass removes it. A chip is never counted before it is minted — minting needs days of
 * sustained unrest, so a cast that raises unrest reads as a move inside the band.
 */
function worstUnrestBand(graph: WorldGraph, locationId: string, unrest: number | undefined): EconomyUnrestBand | null {
  const traits = new Set(graph.getOutgoingEdges(locationId, 'has_trait').map(e => e.target));
  let worst: EconomyUnrestBand | null = null;
  for (const band of ECONOMY_UNREST_BAND_ORDER) {
    const traitId = band === 'on_the_edge' ? LOCATION_TRAIT_IDS.onTheEdge : LOCATION_TRAIT_IDS[band];
    if (!traits.has(traitId)) continue;
    if (unrest !== undefined && unrest < UNREST_BAND_RELEASE[band]) continue;
    worst = band;
  }
  return worst;
}

function readStaples(
  graph: WorldGraph,
  locationId: string,
  props: Record<string, unknown>,
  realmMap: ReadonlyMap<string, string> | undefined,
): Map<string, EconomyStapleSnapshot> {
  const staples = new Map<string, EconomyStapleSnapshot>();
  const resources = readResources(props);
  if (Object.keys(resources).length === 0) return staples;
  // The embargo cut the stock-tier phase applies, read through the same realm map it
  // reads (`realmBorderMap`), so both agree on which towns an embargo touches.
  const cutSet = REGIONAL_MONOPOLY_ENABLED ? embargoCutsByLocation(graph, realmMap).get(locationId) : undefined;
  const cuts = cutSet ? new Map([...cutSet].map(rid => [rid, EMBARGO_BALANCE_CUT] as const)) : undefined;
  const derivation = deriveLocationStockTiers(props, getSublocationsAt(graph, locationId).length, cuts);
  for (const [resourceId, instance] of Object.entries(resources)) {
    if (getResourceClass(resourceId).category !== 'staple') continue;
    const derived = derivation.perResource[resourceId];
    if (!derived || typeof instance?.quantity !== 'number') continue;
    staples.set(resourceId, {
      tier: derived.tier,
      quantity: instance.quantity,
      ...(instance.stockTier ? { storedTier: instance.stockTier } : {}),
    });
  }
  return staples;
}

function readLanes(graph: WorldGraph, locationId: string): Map<string, EconomyLaneSnapshot> {
  const lanes = new Map<string, EconomyLaneSnapshot>();
  const edges = [
    ...graph.getOutgoingEdges(locationId, 'trades_with'),
    ...graph.getIncomingEdges(locationId, 'trades_with'),
  ];
  for (const edge of edges) {
    const p = (edge.properties ?? {}) as Record<string, unknown>;
    lanes.set(edge.id, { threatened: p.threatened === true, volume: finite(p.volume) ?? 1 });
  }
  return lanes;
}

/**
 * Read the economy part of a cast target. Undefined when receipts are switched off or
 * the target is neither a place nor a mortal with Means.
 */
export function snapshotCastEconomy(
  graph: WorldGraph,
  targetId: string,
  /** The realm border map the stock-tier phase reads (`realmBorderMap`); absent reads none. */
  realmMap?: ReadonlyMap<string, string>,
): CastEconomySnapshot | undefined {
  if (!ECONOMY_RECEIPTS_ENABLED) return undefined;
  const node = graph.getNode(targetId);
  if (!node) return undefined;

  if (node.type === 'location') {
    const place = resolveToParentLocation(graph, node);
    if (!place) return undefined;
    const props = (place.properties ?? {}) as Record<string, unknown>;
    const prosperity = finite(props.prosperity);
    const unrest = finite(props.unrest);
    return {
      settlementId: place.id,
      settlementName: place.name,
      ...(prosperity !== undefined ? { prosperity, prosperityTier: getProsperityTier(prosperity) } : {}),
      ...(unrest !== undefined ? { unrest } : {}),
      unrestBand: worstUnrestBand(graph, place.id, unrest),
      staples: readStaples(graph, place.id, props, realmMap),
      lanes: readLanes(graph, place.id),
      landShocks: new Map(readLandShocks(place).map(sh => [
        `${sh.source}:${sh.startTick}`,
        { source: sh.source, ...(sh.direction ? { direction: sh.direction } : {}) },
      ] as const)),
    };
  }

  const props = (node.properties ?? {}) as Record<string, unknown>;
  // Means is an individual mortal's; a faction's purse is not this row.
  if (node.type !== 'actor' || props.actorType !== 'individual') return undefined;
  if (finite(props.wealth) === undefined) return undefined;
  const wealth = readWealth(props);
  return { wealth, meansBand: getWealthTier(wealth) };
}

// ─── Diff ────────────────────────────────────────────────────────────────────

export interface EconomyDiffContext {
  /** `${actionId}:step:${n}` — the id stem the change ids extend. */
  readonly idStem: string;
  readonly targetId: string;
  readonly targetName: string;
}

function rowFields(
  quantity: EconomyReceiptQuantity,
  direction: EconomyReceiptDirection,
): Pick<EncounterAftermathChange, 'polarity' | 'category' | 'direction' | 'stateNoun'> {
  const gain = (direction === 'up') === ECONOMY_RECEIPT_UP_IS_GAIN[quantity];
  return {
    polarity: gain ? 'gain' : 'loss',
    category: gain ? 'boon' : 'scar',
    direction: gain ? 'gain' : 'loss',
    stateNoun: ECONOMY_RECEIPT_NOUNS[quantity],
  };
}

function placeChange(
  ctx: EconomyDiffContext,
  town: { id: string; name: string },
  quantity: Exclude<EconomyReceiptQuantity, 'means'>,
  direction: EconomyReceiptDirection,
  crossed: boolean,
  line: EconomyReceiptLine,
  slots: Readonly<Record<string, string | undefined>>,
  key: string,
): EncounterAftermathChange | null {
  const detail = fillEconomyReceiptLine(line.detail, { town: town.name, ...slots });
  if (!detail) return null;
  return {
    id: `${ctx.idStem}:target:${ctx.targetId}:economy:${quantity}:${key}`,
    kind: 'economy',
    title: line.title,
    detail,
    ...rowFields(quantity, direction),
    // Law 21: the town's name routes to its page.
    ...(detail.includes(town.name)
      ? { concepts: [{ text: town.name, entityId: town.id, visualKind: 'location' as const }] }
      : {}),
    actorId: ctx.targetId,
    actorName: ctx.targetName,
    subjectId: ctx.targetId,
    economyQuantity: quantity,
    crossed,
  };
}

function prosperityChanges(
  before: CastEconomySnapshot,
  after: CastEconomySnapshot,
  ctx: EconomyDiffContext,
  town: { id: string; name: string },
): EncounterAftermathChange[] {
  if (before.prosperity === undefined || after.prosperity === undefined) return [];
  if (!before.prosperityTier || !after.prosperityTier) return [];
  if (after.prosperity === before.prosperity) return [];
  const direction: EconomyReceiptDirection = after.prosperity > before.prosperity ? 'up' : 'down';
  const crossed = after.prosperityTier !== before.prosperityTier;
  const rows = ECONOMY_RECEIPT_LINES.prosperity[direction];
  const change = placeChange(ctx, town, 'prosperity', direction, crossed, crossed ? rows.crossed : rows.inside, {
    from: prosperityReceiptWord(before.prosperityTier),
    to: prosperityReceiptWord(after.prosperityTier),
  }, crossed ? 'crossed' : 'inside');
  return change ? [change] : [];
}

function unrestChanges(
  before: CastEconomySnapshot,
  after: CastEconomySnapshot,
  ctx: EconomyDiffContext,
  town: { id: string; name: string },
): EncounterAftermathChange[] {
  const bandBefore = before.unrestBand ?? null;
  const bandAfter = after.unrestBand ?? null;
  if (bandBefore !== bandAfter) {
    const rank = (b: EconomyUnrestBand | null) => (b === null ? -1 : ECONOMY_UNREST_BAND_ORDER.indexOf(b));
    const direction: EconomyReceiptDirection = rank(bandAfter) > rank(bandBefore) ? 'up' : 'down';
    const change = placeChange(ctx, town, 'unrest', direction, true, ECONOMY_RECEIPT_LINES.unrest[direction].crossed, {
      from: bandBefore ? ECONOMY_UNREST_BAND_WORDS[bandBefore].from : undefined,
      to: bandAfter ? ECONOMY_UNREST_BAND_WORDS[bandAfter].to : undefined,
    }, 'crossed');
    return change ? [change] : [];
  }
  if (before.unrest === undefined || after.unrest === undefined || after.unrest === before.unrest) return [];
  const direction: EconomyReceiptDirection = after.unrest > before.unrest ? 'up' : 'down';
  const change = placeChange(ctx, town, 'unrest', direction, false, ECONOMY_RECEIPT_LINES.unrest[direction].inside, {}, 'inside');
  return change ? [change] : [];
}

function stapleChanges(
  before: CastEconomySnapshot,
  after: CastEconomySnapshot,
  ctx: EconomyDiffContext,
  town: { id: string; name: string },
): EncounterAftermathChange[] {
  const out: EncounterAftermathChange[] = [];
  if (!before.staples || !after.staples) return out;
  // Sorted by id so the rows' order is deterministic (NFP #3).
  for (const resourceId of [...after.staples.keys()].sort()) {
    const was = before.staples.get(resourceId);
    const now = after.staples.get(resourceId)!;
    if (!was || was.quantity === now.quantity || was.tier === now.tier) continue;
    // The derivation before the cast must agree with the tier the page shows. When it
    // does not (an embargo cut the graph alone cannot see, or a stale tier), the row is
    // left out rather than naming a tier the page will contradict (Law 56).
    if (was.storedTier !== undefined && was.storedTier !== was.tier) continue;
    const direction: EconomyReceiptDirection =
      ECONOMY_STOCK_ORDER.indexOf(now.tier) > ECONOMY_STOCK_ORDER.indexOf(was.tier) ? 'up' : 'down';
    const touchesScarce = was.tier === 'scarce' || now.tier === 'scarce';
    const line = touchesScarce ? ECONOMY_RECEIPT_LINES.staple[direction].crossed : ECONOMY_STAPLE_PLENTY_LINES[direction];
    const good = RESOURCE_DEFINITIONS[resourceId]?.name?.toLowerCase();
    const change = placeChange(ctx, town, 'staple', direction, true, line, { good }, resourceId);
    if (change) out.push(change);
  }
  return out;
}

function laneChanges(
  before: CastEconomySnapshot,
  after: CastEconomySnapshot,
  ctx: EconomyDiffContext,
  town: { id: string; name: string },
): EncounterAftermathChange[] {
  if (!before.lanes || !after.lanes) return [];
  let freed = false;
  let threatened = false;
  let volumeBefore = 0;
  let volumeAfter = 0;
  for (const [edgeId, now] of after.lanes) {
    const was = before.lanes.get(edgeId);
    if (!was) continue;
    if (was.threatened && !now.threatened) freed = true;
    if (!was.threatened && now.threatened) threatened = true;
    volumeBefore += was.volume;
    volumeAfter += now.volume;
  }
  const out: EncounterAftermathChange[] = [];
  const crossedRow = (direction: EconomyReceiptDirection) => {
    const c = placeChange(ctx, town, 'lane', direction, true, ECONOMY_RECEIPT_LINES.lane[direction].crossed, {}, `crossed:${direction}`);
    if (c) out.push(c);
  };
  if (freed) crossedRow('up');
  if (threatened) crossedRow('down');
  if (out.length === 0 && volumeAfter !== volumeBefore) {
    const direction: EconomyReceiptDirection = volumeAfter > volumeBefore ? 'up' : 'down';
    const c = placeChange(ctx, town, 'lane', direction, false, ECONOMY_RECEIPT_LINES.lane[direction].inside, {}, 'inside');
    if (c) out.push(c);
  }
  return out;
}

/** THR-1923 — a land shock the cast laid: one row naming which fields, and that it fades. */
function landChanges(
  before: CastEconomySnapshot,
  after: CastEconomySnapshot,
  ctx: EconomyDiffContext,
  town: { id: string; name: string },
): EncounterAftermathChange[] {
  if (!before.landShocks || !after.landShocks) return [];
  const out: EncounterAftermathChange[] = [];
  for (const key of [...after.landShocks.keys()].sort()) {
    if (before.landShocks.has(key)) continue;
    const shock = after.landShocks.get(key)!;
    const line = LAND_SHOCK_RECEIPT_LINES[shock.source];
    if (!line) continue;
    const where = (shock.direction ? LAND_SHOCK_WHERE_WORDS[shock.direction] : undefined) ?? line.whereFallback;
    const detail = fillEconomyReceiptLine(line.detail, { town: town.name, where });
    if (!detail) continue;
    out.push({
      id: `${ctx.idStem}:target:${ctx.targetId}:economy:land:${key}`,
      kind: 'economy',
      title: line.title,
      detail,
      polarity: line.gain ? 'gain' : 'loss',
      category: line.gain ? 'boon' : 'scar',
      direction: line.gain ? 'gain' : 'loss',
      stateNoun: ECONOMY_RECEIPT_NOUNS.land,
      ...(detail.includes(town.name)
        ? { concepts: [{ text: town.name, entityId: town.id, visualKind: 'location' as const }] }
        : {}),
      actorId: ctx.targetId,
      actorName: ctx.targetName,
      subjectId: ctx.targetId,
      economyQuantity: 'land',
      crossed: false,
    });
  }
  return out;
}

function meansChanges(
  before: CastEconomySnapshot,
  after: CastEconomySnapshot,
  ctx: EconomyDiffContext,
): EncounterAftermathChange[] {
  if (before.wealth === undefined || after.wealth === undefined) return [];
  if (!before.meansBand || !after.meansBand || after.wealth === before.wealth) return [];
  // Mortal wealth owns these words (THR-1936): one sentence shape for the kind.
  const words = meansChangeSentence(ctx.targetName, {
    wealthBefore: before.wealth,
    wealthAfter: after.wealth,
    bandBefore: before.meansBand,
    bandAfter: after.meansBand,
  });
  const crossed = after.meansBand !== before.meansBand;
  const who = ctx.targetName.trim().length > 0 ? ctx.targetName : undefined;
  return [{
    id: `${ctx.idStem}:target:${ctx.targetId}:economy:means`,
    kind: 'economy',
    title: words.title,
    detail: words.detail,
    polarity: words.polarity,
    category: words.polarity === 'gain' ? 'boon' : 'scar',
    direction: words.polarity,
    stateNoun: { text: 'Means', tooltipId: MEANS_CHANGE_TOOLTIP_ID },
    ...(who && words.detail.includes(who)
      ? { concepts: [{ text: who, entityId: ctx.targetId, visualKind: 'agent' as const }] }
      : {}),
    actorId: ctx.targetId,
    actorName: who,
    subjectId: ctx.targetId,
    economyQuantity: 'means',
    crossed,
  }];
}

/**
 * Diff two economy snapshots of one target into `economy` changes: crossed rows first,
 * then unrest, prosperity, staples, lanes; a mortal gives its one Means row. Only a real
 * move produces a change (Law 56).
 */
export function diffCastEconomy(
  before: CastEconomySnapshot | undefined,
  after: CastEconomySnapshot | undefined,
  ctx: EconomyDiffContext,
): EncounterAftermathChange[] {
  if (!before || !after) return [];
  if (before.settlementId && before.settlementId === after.settlementId) {
    const town = { id: before.settlementId, name: after.settlementName ?? before.settlementName ?? '' };
    if (town.name.trim().length === 0) return [];
    const rows = [
      ...unrestChanges(before, after, ctx, town),
      ...prosperityChanges(before, after, ctx, town),
      ...stapleChanges(before, after, ctx, town),
      ...laneChanges(before, after, ctx, town),
      ...landChanges(before, after, ctx, town),
    ];
    // Crossed rows lead (stable sort): the receipt's first target change is the line
    // its toast and overview read, and a crossed band is the news.
    return rows.sort((a, b) => Number(b.crossed === true) - Number(a.crossed === true));
  }
  return meansChanges(before, after, ctx);
}

/** True for an `economy` change on a cast's target that crossed a band — it opens the dialog. */
export function isCrossedTargetEconomyChange(change: EncounterAftermathChange): boolean {
  return change.kind === 'economy' && change.subjectId !== undefined && change.crossed === true;
}
