/**
 * actionCardModel — a `WheelSlot` read as the one card face (THR-1002).
 *
 * The action card's whole implementation, minus the JSX. `ActionCard` is a
 * component that calls this and hands the result to `shared/CardFace`; the nudge
 * card's adapter has the same shape. That is the ticket's claim made structural:
 * the two cards cannot drift, because there is only one face and each kind of card
 * is nothing but a function from its own data into that face's model.
 *
 * **What this file is allowed to put on a card, and what it is not.**
 *
 * - Every zone is a *word* or a *pip*. No numeral reaches the model (Law 13); the
 *   numbers the designer needs go in {@link CardFaceModel.designerLine}, which the
 *   DebugPanel's designer-view toggle gates.
 * - No raw key reaches it either (Law 14). The verb comes from the template's
 *   declared `crudType` through `ACTION_VERB_WORDS`, never from splitting the slot
 *   id — that string surgery (`parseTypeLine`) is what this replaced, and it
 *   printed `IRON · CREATE` at the player.
 * - Odds are the forecast **word**, never pips (Law 10). A cast rolls the odds; it
 *   does not move them. The pips on the other card mean the other thing.
 *
 * Spec: `Docs/plans/2026-09-09-thr-1002-card-grammar.md` § UI pillar.
 */

import type { CardFaceModel, CardFaceCostChannel } from '../shared/CardFace';
import { bandAccentColor } from './outcomeBandAccent';
import type { WheelSlot } from '../../engine/wheel';
import type { OutcomeBand } from '../../engine/outcomeConsequences';
import { outcomeBandWord } from '../../data/outcome-band-content';
import { gradientIndexForId } from '../../data/entity-visual-fallbacks';
import { getActionArt } from './actionArt';
import {
  ACTION_VERB_WORDS,
  ACTION_CARD_KEYWORD_ICONS,
  ACTION_CONTROL_VERB_WORD,
  ACTION_CONTROL_VERB_ICON,
  UPKEEP_CHANNEL_ICON,
  actionBlockedReason,
  upkeepChannelLabel,
  verbTooltipId,
  scaleTooltipId,
  upkeepTooltipId,
  type ActionCrudType,
} from '../../data/action-card-display';

/**
 * Lowest rarity tier that earns a badge on an action card.
 *
 * Storied and above. Every action in the game has a tier, so badging all of them
 * would put the word *Mundane* on most of the hand — a label that distinguishes
 * nothing is chrome, not information (Law 9's rule read the other way round: one
 * vocabulary per element class, and only where the class says something). The
 * threshold is the action card's editorial choice, so it lives here rather than in
 * `CardFace`, which renders whatever tier it is handed.
 */
export const ACTION_CARD_MIN_BADGED_RARITY = 2;

/** The fallback verb word for a slot whose template declared no CRUD type. */
export const ACTION_VERB_FALLBACK_WORD = 'Working';
/** The fallback verb glyph, paired with {@link ACTION_VERB_FALLBACK_WORD}. */
export const ACTION_VERB_FALLBACK_ICON = '◇';

/**
 * The verb chip a slot prints: word, glyph, and registry id.
 *
 * A **sustained** action is filed under Control whatever its CRUD type, because
 * to the player it is a different kind of card — the one that keeps charging. The
 * change it happens to make is secondary to the fact that it holds something open.
 *
 * Fail-soft (plan's own row): a slot with no `crudType` prints *Working* on the
 * generic glyph rather than an empty chip. That is the honest reading — something
 * is being done — and it keeps the chip's shape stable across the row.
 */
export function actionVerbChip(slot: WheelSlot): { label: string; icon: string; tooltipId: string } {
  if (slot.durationMode === 'sustained') {
    return {
      label: ACTION_CONTROL_VERB_WORD,
      icon: ACTION_CONTROL_VERB_ICON,
      tooltipId: verbTooltipId('sustained'),
    };
  }
  const crud = slot.crudType;
  if (!crud || !(crud in ACTION_VERB_WORDS)) {
    return {
      label: ACTION_VERB_FALLBACK_WORD,
      icon: ACTION_VERB_FALLBACK_ICON,
      tooltipId: verbTooltipId('update'),
    };
  }
  return {
    label: ACTION_VERB_WORDS[crud],
    icon: ACTION_CARD_KEYWORD_ICONS[crud],
    tooltipId: verbTooltipId(crud as ActionCrudType),
  };
}

export interface ActionCardModelOptions {
  /** The card is the drawer's armed selection (Law 48 — arm, then fire). */
  readonly selected?: boolean;
  /**
   * The band this action's last cast resolved to, if the drawer knows one.
   *
   * Law 37: the ending wears the chrome of the card that started it. The receipt
   * queue is the authority; the drawer maps it by template id and passes it here.
   */
  readonly resolvedBand?: OutcomeBand;
  /** Mid-dispatch. The card stops being a control while its cast is in flight. */
  readonly playing?: boolean;
  /**
   * Pure display — the Ascendant Beat unlock reveal shows a card the player is
   * being *given*, not one they can play (THR-639). Full brightness, no affordance.
   */
  readonly interactive?: boolean;
  /** Open the codex entry for this action (Law 21). Absent ⇒ the name is text. */
  readonly onOpenName?: () => void;
}

/**
 * Read a slot as a card face.
 *
 * Deterministic and side-effect free: same slot, same model. Everything the face
 * needs has already been decided by the slot builder — this function chooses
 * *words for facts*, and never computes a fact of its own.
 */
export function actionCardModel(slot: WheelSlot, opts: ActionCardModelOptions = {}): CardFaceModel {
  const { selected = false, resolvedBand, playing = false, interactive = true, onOpenName } = opts;

  const verb = actionVerbChip(slot);
  const artPath = getActionArt(slot.id);
  const dimmed = !slot.available && !playing;
  const blockedReason = dimmed ? actionBlockedReason(slot.lockedReason, slot.rangeStatus) : undefined;

  // An unaffordable card emphasises its price, so the reason the card is dim is
  // legible from the zone that caused it rather than only from the sentence.
  const costEmphasised = dimmed && /essence/i.test(slot.lockedReason ?? '');

  const costChannels: CardFaceCostChannel[] = [];
  if (slot.upkeepWord) {
    costChannels.push({
      id: 'upkeep',
      icon: UPKEEP_CHANNEL_ICON,
      label: upkeepChannelLabel(slot.upkeepWord),
      // An upkeep band is not a worsening of *these* odds — it is a standing
      // price. Its whole reading is in the word, so it draws no penalty pips.
      delta: 0,
      tooltipId: upkeepTooltipId(slot.upkeepWord),
    });
  }

  return {
    id: slot.id,
    testIdPrefix: 'action-card',
    dataAttributes: {
      'data-action-state': playing ? 'playing' : selected ? 'selected' : dimmed ? 'dimmed' : 'playable',
      'data-action-verb': verb.label,
    },
    picture: {
      tier: artPath ? 'art' : 'fallback',
      // `src` only on the art tier; the glyph stays populated either way because
      // `EntityVisual` uses it as the <img> onError swap target.
      ...(artPath ? { src: artPath } : {}),
      glyph: verb.icon,
      gradientIndex: gradientIndexForId(slot.templateId ?? slot.id),
      alt: slot.spellName ?? slot.label,
      // An action is not an agent, a place or an artifact; `unknown` is the
      // honest kind, and it renders the supplied glyph on the id-hashed gradient
      // rather than a person tile.
      kind: 'unknown',
    },
    keyword: { label: verb.label, icon: verb.icon, tooltipId: verb.tooltipId },
    ...(slot.scaleWord && slot.scale
      ? { secondaryKeyword: { label: slot.scaleWord, tooltipId: scaleTooltipId(slot.scale) } }
      : {}),
    ...(slot.reach ? { reach: slot.reach } : {}),
    ...(slot.sphere ? { sphere: slot.sphere } : {}),
    // Laws 1 + 17: the reach and sphere marks carry their registry tooltips here.
    // Opt-in on the face because the nudge card's DOM is pinned; see `CardFace`.
    markTooltips: true,
    cost: slot.essenceCost,
    costEmphasised,
    ...(costChannels.length > 0 ? { costChannels } : {}),
    name: slot.spellName ?? slot.label,
    ...(onOpenName ? { onOpenName } : {}),
    // The card's one line. `effectsLine` is authored content (`actionEffectsProse`)
    // and is the only text the face carries — `description` and `technicalEffect`
    // are the codex page's job (Prose Doctrine v2; Law 16).
    effectLine: slot.effectsLine ?? '',
    // Omitted, never guessed: a slot built without a capability map carries no
    // tier, and a card with no odds zone is honest about not knowing.
    odds: slot.forecastTier ? { kind: 'forecast', tier: slot.forecastTier } : null,
    ...(slot.rarityTier != null && slot.rarityTier >= ACTION_CARD_MIN_BADGED_RARITY
      ? { rarityTier: slot.rarityTier }
      : {}),
    ...(blockedReason ? { blockedReason } : {}),
    ...(resolvedBand
      ? {
          resolvedBand: {
            word: outcomeBandWord(resolvedBand),
            color: bandAccentColor(resolvedBand, 'var(--accent-gold)'),
          },
        }
      : {}),
    selected,
    dimmed,
    // A card mid-dispatch is not a control, and neither is a display-only one.
    disabled: playing || !interactive,
    designerLine: actionDesignerLine(slot),
  };
}

/**
 * The numerals, for the designer view only (Law 13).
 *
 * Everything the retired face used to print at the player lives here: the
 * effective difficulty the roll will use, the authored price it came from, the
 * hex distance, and the raw per-tick cost the upkeep band was derived from.
 */
function actionDesignerLine(slot: WheelSlot): string {
  const parts: string[] = [];
  if (slot.forecastTier) parts.push(slot.forecastTier);
  if (slot.effectiveStepDifficulty != null) parts.push(`eff ${slot.effectiveStepDifficulty.toFixed(2)}`);
  if (slot.maxStepDifficulty != null) parts.push(`max ${slot.maxStepDifficulty.toFixed(2)}`);
  if (slot.scale) parts.push(slot.scale);
  if (slot.hexDistance != null) parts.push(`${slot.hexDistance} hex`);
  if (slot.perTickCostLabel) parts.push(slot.perTickCostLabel);
  return parts.join(' · ');
}
