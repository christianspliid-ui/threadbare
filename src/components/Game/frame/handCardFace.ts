/**
 * handCardFace — the god rail hand row's card face, with no target (THR-1975, frame plan § F6).
 *
 * "Hover opens a `HoverCard` with the full `CardFace`." The face's producer
 * (`actionCardModel`) reads a `WheelSlot`, and every live slot is built against a target.
 * A hand row has none, so this builds the slot the Ascendant Beat's reveal already builds
 * for the same reason (`templateToPreviewSlot`, THR-639) and lays the row's own facts over
 * it:
 *
 * - the **par price** (`HandCardVM.parCost`) — the price the row prints, not the
 *   template's authored one;
 * - the **paying sphere** (`HandCardVM.paySphere`) — so a sphere-less card is tinted and
 *   priced by the pool that will actually pay, as the row's left edge is;
 * - **payable / reason** — an unpayable card is dimmed and says why (Law 25);
 * - **no odds** — no target, no roll; the face omits the zone rather than guessing.
 *
 * Pure: same row and template, same model.
 */
import type { HandCardVM } from '../../../engine/views/godRail';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';
import type { CardFaceModel } from '../../shared/CardFace';
import { actionCardModel } from '../actionCardModel';
import { templateToPreviewSlot } from '../AscendantBeatModal';

/** `data-testid` stem for the hover face's zones (`hand-card-face-art-<id>`, …). */
export const HAND_CARD_FACE_TEST_ID = 'hand-card-face';

export function handCardFaceModel(card: HandCardVM, template: UnifiedActionTemplate): CardFaceModel {
  const preview = templateToPreviewSlot(template);
  const slot = {
    ...preview,
    label: card.name,
    spellName: card.name,
    essenceCost: card.parCost,
    sphere: card.paySphere,
    available: card.payable,
    lockedReason: card.reason,
    // The card's one line. A template with no effects prose still says what it is —
    // its description, the line the row's interim tooltip carried.
    effectsLine: preview.effectsLine || card.description,
  };
  return {
    ...actionCardModel(slot, { interactive: true }),
    testIdPrefix: HAND_CARD_FACE_TEST_ID,
  };
}
