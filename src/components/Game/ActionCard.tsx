/**
 * ActionCard — one action, drawn on the one card face (THR-1002).
 *
 * This file used to be two cards: a 160×110 art-only tile for the fan and a
 * 400×560 MTG-style frame for the focused overlay, neither of which was the face
 * the nudge card had established. Christian's directive of 2026-08-06 —
 * *"players would expect the same type of syntax and rough layout and language
 * for all 'cards' in the game"* — is what retired both. There is now **one size
 * and one face**: `shared/CardFace`, the same primitive `NudgeCard` renders,
 * fed by {@link actionCardModel}.
 *
 * What went, and why each had to:
 *
 * - **The type line** (`IRON · CREATE`) — a raw schema key split out of the slot
 *   id (Law 14). The verb chip prints the declared `crudType` as a word.
 * - **The numeral cost badge** (`3`) — Law 13. The price is framed pips.
 * - **`{n} hex`** — Law 13, and a measurement of the board rather than a fact
 *   about the working. The scale chip says *Local*; being out of reach became a
 *   blocked reason in words.
 * - **`{X}% risk`** — dead *and* a Law 13 violation (THR-1002 retired the read;
 *   the authored values stay, because `computeDetection` still rolls them).
 * - **`technicalDescription`** and the drawer's Effect block — the codex page's
 *   job. A card says what it does and nothing else (Prose Doctrine v2, Law 16).
 * - **The inline `<style>` blocks** — two copies of the same keyframes, injected
 *   per card, per render.
 *
 * The dispatch animation went with them. It was a per-card `box-shadow` pulse
 * keyed to the moment of *dispatch*, not resolution — and the card now says what
 * happened in words, wearing its band's fate word on the same face it was cast
 * from (Laws 37/47), which is the feedback that beat was standing in for.
 */

import React, { useCallback, useSyncExternalStore } from 'react';
import type { WheelSlot } from '../../engine/wheel';
import type { OutcomeBand } from '../../engine/outcomeConsequences';
import { CardFace } from '../shared/CardFace';
import { actionCardModel } from './actionCardModel';
import {
  isNudgeDesignerViewEnabled,
  subscribeNudgeDesignerView,
} from './encounter-stage/designerView';

interface ActionCardProps {
  /** The wheel slot to display */
  slot: WheelSlot;
  /** Callback when the card is clicked. Not called on a dimmed or playing card. */
  onClick: (slotId: string) => void;
  /** Whether this card's cast is currently in flight */
  playing?: boolean;
  /** The card is the drawer's armed selection (Law 48 — arm, then fire) */
  selected?: boolean;
  /**
   * The band this action's last cast resolved to. Law 37: the ending wears the
   * chrome of the card that started it.
   */
  resolvedBand?: OutcomeBand;
  /** Open this action's codex entry (Law 21). Absent ⇒ the name renders as text. */
  onOpenCodexEntry?: (templateId: string) => void;
  /**
   * Whether the card is a live play affordance. Default true (all existing call
   * sites). Set false for pure display — e.g. the Ascendant Beat unlock reveal
   * (THR-639): the card stays full-brightness but drops the click handler, so it
   * reads as a shown card, not a playable one.
   */
  interactive?: boolean;
}

/**
 * ActionCard — displays a single action slot as a card.
 */
export const ActionCard = React.memo(function ActionCard({
  slot, onClick, playing = false, selected = false, resolvedBand,
  onOpenCodexEntry, interactive = true,
}: ActionCardProps) {
  // The designer view is one toggle for every card in the game — the same store
  // the nudge hand reads. Two toggles for one concept would be a second
  // vocabulary for "show me the numbers" (Law 9's rule, applied to a control).
  const designerView = useSyncExternalStore(
    subscribeNudgeDesignerView,
    isNudgeDesignerViewEnabled,
    // Server snapshot — the drawer never renders server-side, but the third
    // argument keeps `useSyncExternalStore` from warning under test renderers.
    isNudgeDesignerViewEnabled,
  );

  const handleToggle = useCallback(() => {
    if (!interactive || playing) return;
    onClick(slot.id);
  }, [interactive, playing, onClick, slot.id]);

  const templateId = slot.templateId;
  const handleOpenName = useCallback(() => {
    if (templateId) onOpenCodexEntry?.(templateId);
  }, [onOpenCodexEntry, templateId]);

  return (
    <CardFace
      designerView={designerView}
      onToggle={handleToggle}
      model={actionCardModel(slot, {
        selected,
        playing,
        interactive,
        ...(resolvedBand ? { resolvedBand } : {}),
        // Law 21 is *"where a page exists"*: the codex keys its action entries on
        // the bare template id, so a slot that never carried one gets a plain
        // title rather than a link that goes nowhere.
        ...(onOpenCodexEntry && templateId ? { onOpenName: handleOpenName } : {}),
      })}
    />
  );
});

ActionCard.displayName = 'ActionCard';
