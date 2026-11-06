/**
 * The Crossroads row on a person's page (THR-1928, slice B of THR-1926 — plan
 * `Docs/plans/2026-10-14-thr-1926-the-crossroads.md` § UI pillar).
 *
 * Reads the snapshot slice A writes at each full decision (`crossroads`) and the held
 * lean (`crossroadsLean`) and words them as one `cards` section with an act strip:
 * "Next, Kael weighs", the settledness line, up to three roads, and on each road the
 * arm-then-fire offers — "Lean toward" on every road, "Lean away" on the first only
 * (Law 25: away on a non-leader cannot matter). Each offer carries the forecast word,
 * the price and the confirm sentence before paying (Law 17), computed with the same
 * functions `placeCrossroadsLean` uses, so the strip and the spend never disagree (Law 18).
 *
 * Gated exactly as the action is: the Crossroads on, a thread from the god, the mind
 * readable (`canReadIntention`, THR-1433), a reading with at least one road. Otherwise
 * null — nothing renders (Law 25). Pure: reads state, writes nothing.
 */
import type { CardActOffer, CardTile, CardsSection, SentencePart } from '../../../types/detailPage';
import type { GameState } from '../../../types/gameState';
import type { WorldRef } from '../../../types/worldRef';
import type { SimulationRuntime } from '../../simulationRuntime';
import type { SectionResolver } from '../../detailPageResolvers';
import { CROSSROADS_ENABLED, REACH_TO_SPHERE } from '../../../data/premonition-constants';
import {
  CROSSROADS_CONTROLS,
  CROSSROADS_HEADING,
  CROSSROADS_KIND_WORD,
  CROSSROADS_TARGET_LEAD,
  LEAN_CONFIRM,
  LEAN_FORECAST,
  LEAN_HELD,
  LEAN_REFUSAL,
  SETTLEDNESS_LINE,
  fillCrossroadsLine,
} from '../../../data/crossroads-content';
import {
  forecastLean,
  leanBaseCost,
  readCrossroadsLean,
  readCrossroadsSnapshot,
  sameRoad,
  settledness,
  type CrossroadsOption,
  type LeanDirection,
} from '../../crossroads';
import { godThreadsMortal } from '../../crossroadsActions';
import { crossroadsRoadName } from '../../crossroadsNames';
import { canReadIntention } from '../../intentionReading';
import { castTargetBand, dominionScaledCost } from '../../dominion';
import { worldRefKindOf } from '../../undertakingDeed';
import { getStrategicTemplate } from '../../strategicActionCandidates';
import { getEncounterForeshadowingById } from '../../foreshadowing/encounterForeshadowing';

/** The Inspector registry id of the row (and the badge's scroll target). */
export const CROSSROADS_ROW_TYPE_ID = 'crossroads';

function capitalize(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

/** The first sentence of a passage — the road's one line. */
function firstSentence(text: string | undefined | null): string | null {
  const t = (text ?? '').trim();
  if (!t) return null;
  const m = t.match(/^.*?[.!?](?=\s|$)/);
  return (m ? m[0] : t).trim();
}

/** The road's one line in the mortal's voice: foreshadowing for a chance, the work's own words for a work. */
function roadLine(state: GameState, agentId: string, option: CrossroadsOption, runtime: SimulationRuntime | null | undefined): string | null {
  try {
    if (option.family === 'encounter') {
      if (!runtime) return null;
      const f = getEncounterForeshadowingById(state, agentId, option.templateId, state.tick, runtime);
      const line = firstSentence(f.tooltipProse ?? f.prose);
      return line && !line.includes('{') && line !== '...' ? line : null;
    }
    const prose = getStrategicTemplate(option.templateId)?.activityProse ?? [];
    const line = prose.find(p => typeof p === 'string' && p.trim() && !p.includes('{'));
    return firstSentence(line);
  } catch {
    return null; // NFP #4: a road without its line still reads by name.
  }
}

/** The road's target as an identity link (Law 21): the place for a chance, the work's target for a work. */
function roadTarget(state: GameState, option: CrossroadsOption): WorldRef | undefined {
  if (!option.targetId) return undefined;
  const node = state.graph.getNode(option.targetId);
  const kind = worldRefKindOf(node);
  return node && kind ? { kind, id: node.id, name: node.name } : undefined;
}

/** What one offer says and costs, through the same functions the spend uses. */
function offerFor(
  state: GameState,
  agentId: string,
  name: string,
  snapshot: { tick: number; options: CrossroadsOption[] },
  rank: number,
  direction: LeanDirection,
): CardActOffer {
  const option = snapshot.options[rank];
  const sphere = REACH_TO_SPHERE[option.reach];
  const band = castTargetBand(state.graph, state.ascendantId, agentId);
  const cost = dominionScaledCost(leanBaseCost(rank, direction), band);
  const forecast = forecastLean(snapshot, { ...option, direction });
  const road = crossroadsRoadName(option);
  const sphereWord = capitalize(sphere);
  const affordable = (state.essencePool[sphere] ?? 0) >= cost;
  return {
    optionIndex: rank,
    direction,
    label: CROSSROADS_CONTROLS[direction],
    labelTooltipId: 'ui.crossroads.lean',
    forecast: fillCrossroadsLine(LEAN_FORECAST[direction][forecast], { name }),
    forecastTooltipId: 'ui.crossroads.forecast',
    confirm: fillCrossroadsLine(LEAN_CONFIRM[direction], { name, road, sphere: sphereWord }),
    cost,
    sphere,
    blockedReason: affordable ? null : fillCrossroadsLine(LEAN_REFUSAL.unaffordable, { sphere: sphereWord }),
  };
}

/** Is the reading open to the god for this mortal? The action's own gates, in its order. */
export function crossroadsReadable(state: GameState, agentId: string): boolean {
  if (!CROSSROADS_ENABLED) return false;
  if (!state.graph.getNode(agentId)) return false;
  if (!godThreadsMortal(state, agentId)) return false;
  return canReadIntention(state, state.ascendantId, agentId).readable;
}

/** The section, or null when there is nothing to show (Law 25). */
export function buildCrossroadsSection(
  state: GameState,
  agentId: string,
  runtime?: SimulationRuntime | null,
): CardsSection | null {
  if (!crossroadsReadable(state, agentId)) return null;
  const node = state.graph.getNode(agentId);
  if (!node) return null;
  const snapshot = readCrossroadsSnapshot(node.properties.crossroads);
  if (!snapshot || snapshot.options.length === 0) return null;
  const lean = readCrossroadsLean(node.properties.crossroadsLean);
  const name = node.name;

  const tiles: CardTile[] = snapshot.options.map((option, rank) => {
    const ref = roadTarget(state, option);
    const roadName = crossroadsRoadName(option);
    const line = roadLine(state, agentId, option, runtime);
    const offers = lean ? [] : [
      offerFor(state, agentId, name, snapshot, rank, 'toward'),
      ...(rank === 0 && snapshot.options.length > 1 ? [offerFor(state, agentId, name, snapshot, rank, 'away')] : []),
    ];
    return {
      title: roadName,
      kindWord: CROSSROADS_KIND_WORD[option.family],
      lines: line ? [line] : [],
      // The road's place or target, as a link (Law 21).
      ...(ref ? { byLine: { lead: CROSSROADS_TARGET_LEAD, name: ref.name ?? '', ref } } : {}),
      offers,
      ...(lean && sameRoad(lean, option) ? { marked: true } : {}),
    };
  });

  const word = settledness(snapshot);
  const intro: SentencePart[] | undefined = word
    ? [{ text: fillCrossroadsLine(SETTLEDNESS_LINE[word], { name }), tooltipId: 'ui.crossroads.settledness' }]
    : undefined;
  const leanedRoad = lean ? crossroadsRoadName(lean) : '';

  return {
    kind: 'cards',
    typeId: CROSSROADS_ROW_TYPE_ID,
    label: fillCrossroadsLine(CROSSROADS_HEADING, { name }),
    labelTooltipId: 'ui.crossroads',
    gold: false,
    tier: 'routine',
    source: 'crossroadsRow.crossroads',
    tiles,
    act: {
      kind: 'crossroads',
      subjectId: agentId,
      ...(intro ? { intro } : {}),
      fireLabel: CROSSROADS_CONTROLS.fire,
      cancelLabel: CROSSROADS_CONTROLS.cancel,
      ...(lean ? {
        held: {
          line: fillCrossroadsLine(LEAN_HELD[lean.direction], { name, road: leanedRoad }),
          liftLabel: CROSSROADS_CONTROLS.lift,
          liftTooltipId: 'ui.crossroads.lifted',
        },
      } : {}),
    },
  };
}

/** The registry's resolver: the person page only, and only with state in context. */
export const crossroadsRowResolver: SectionResolver = (ctx) => {
  if (!ctx.state || ctx.pageKind !== 'actor') return null;
  try {
    return buildCrossroadsSection(ctx.state, ctx.nodeId, ctx.runtime);
  } catch {
    return null; // NFP #4.
  }
};
