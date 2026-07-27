/**
 * useNudgeHand — THR-775 (WS2 interface).
 *
 * Component-local toggle state for the nudge hand, plus the live forecast
 * recompute. No GameState field is added: an uncommitted hand is a UI
 * intention, and only the committed ids ride the in-flight action (WS0).
 *
 * **Determinism (NFP #3).** Recompute calls `forecastAction`, the same pure
 * function resolution calls, with the same `ResolutionInput` plus the selected
 * nudges' named deltas. It takes no rng draw, so toggling a card cannot move
 * the world — the word the player watches change is the word the roll will use.
 *
 * **Affordability is live.** Every toggle changes what the remaining budget can
 * buy, so a playable card can become unaffordable without the stage rebuilding.
 * That is computed here rather than in the adapter, which is exactly why
 * `essence_unavailable` dims instead of hiding — a hidden card would flicker.
 */

import { useCallback, useMemo, useState } from 'react';
import { forecastAction } from '../../../engine/resolutionService';
import { FORECAST_TIER_WORDS, NUDGE_BLOCKED_REASONS } from '../../../data/nudge-stage-content';
import type {
  EncounterStageForecastModel,
  EncounterStageNudgeCardModel,
  EncounterStageNudgePhaseModel,
} from './types';

/**
 * The forecast a given selection produces — the single implementation the hook
 * and the commit handler both call, so the tier the player watched change and
 * the tier recorded in `nudge_played` can never disagree.
 *
 * Pure: `forecastAction` takes no rng draw, so this is safe to call on every
 * render and again at commit.
 */
export function forecastWithNudges(
  phase: EncounterStageNudgePhaseModel,
  selectedIds: readonly string[],
): EncounterStageForecastModel {
  const byId = new Map(phase.cards.map((c) => [c.id, c]));
  const nudgeDelta = selectedIds.reduce(
    (sum, id) => sum + (byId.get(id)?.forecastDelta ?? 0),
    0,
  );
  const summary = forecastAction({
    ...phase.forecastInput,
    actionModifiers: phase.forecastInput.actionModifiers + nudgeDelta,
  });
  return {
    tier: summary.forecastTier,
    word: FORECAST_TIER_WORDS[summary.forecastTier],
    probability: summary.successProbability,
  };
}

export interface NudgeHandCard extends EncounterStageNudgeCardModel {
  /** Currently toggled on. */
  selected: boolean;
  /**
   * Whether clicking does anything right now. A selected card is always
   * toggleable — deselecting must never be blocked by the budget it freed.
   */
  interactive: boolean;
}

export interface UseNudgeHandResult {
  cards: NudgeHandCard[];
  selectedIds: string[];
  /** Forecast with the current selection applied — moves as cards toggle. */
  forecast: EncounterStageForecastModel;
  /** Forecast with nothing selected, for the "was → is" read. */
  baseForecast: EncounterStageForecastModel;
  /** Essence the current selection costs. */
  selectedCost: number;
  /** Essence left after paying for the selection. */
  remainingEssence: number;
  /** True when the selection has moved the forecast off its base tier. */
  forecastMoved: boolean;
  toggle: (nudgeId: string) => void;
  clear: () => void;
}

/**
 * Fail-soft: a null phase yields an inert hand rather than forcing every caller
 * to branch. Hooks cannot be called conditionally, so the shell always calls
 * this and renders nothing when there is nothing to render.
 */
export function useNudgeHand(
  phase: EncounterStageNudgePhaseModel | undefined,
): UseNudgeHandResult {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => [...(phase?.committedIds ?? [])]);

  const cardsById = useMemo(() => {
    const map = new Map<string, EncounterStageNudgeCardModel>();
    for (const card of phase?.cards ?? []) map.set(card.id, card);
    return map;
  }, [phase]);

  const toggle = useCallback((nudgeId: string) => {
    setSelectedIds((prev) => (
      prev.includes(nudgeId) ? prev.filter((id) => id !== nudgeId) : [...prev, nudgeId]
    ));
  }, []);

  const clear = useCallback(() => setSelectedIds([]), []);

  const selectedCost = useMemo(
    () => selectedIds.reduce((sum, id) => sum + Math.max(0, cardsById.get(id)?.essenceCost ?? 0), 0),
    [selectedIds, cardsById],
  );

  const availableEssence = phase?.availableEssence ?? 0;
  const remainingEssence = Math.max(0, availableEssence - selectedCost);

  const forecast = useMemo((): EncounterStageForecastModel => {
    if (!phase) return { tier: 'uncertain', word: FORECAST_TIER_WORDS.uncertain, probability: 0 };
    return forecastWithNudges(phase, selectedIds);
  }, [phase, selectedIds]);

  const cards = useMemo((): NudgeHandCard[] => {
    const source = phase?.cards ?? [];
    return source.map((card) => {
      const selected = selectedIds.includes(card.id);
      // Re-price against the live remainder. A selected card stays interactive
      // so the player can always undo; an unselected one needs its own cost to
      // still fit in what is left after everything else selected.
      const affordable = selected || card.essenceCost <= remainingEssence + 1e-9;
      const blocked = card.state === 'dimmed' || !affordable;
      return {
        ...card,
        selected,
        interactive: selected || !blocked,
        state: (selected || affordable) ? card.state : 'dimmed',
        blockedCode: card.blockedCode ?? (affordable ? undefined : 'essence_unavailable'),
        blockedReason: card.blockedReason
          ?? (affordable ? undefined : NUDGE_BLOCKED_REASONS.essence_unavailable),
      };
    });
  }, [phase, selectedIds, remainingEssence]);

  return {
    cards,
    selectedIds,
    forecast,
    baseForecast: phase?.baseForecast
      ?? { tier: 'uncertain', word: FORECAST_TIER_WORDS.uncertain, probability: 0 },
    selectedCost,
    remainingEssence,
    forecastMoved: !!phase && forecast.tier !== phase.baseForecast.tier,
    toggle,
    clear,
  };
}
