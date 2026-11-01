/**
 * AscendantBeatModal — the player-facing "entered beat" surface (THR-517).
 *
 * The Director (THR-500) only *offers* a beat (sets `ascendantBeats.pending`). This
 * is the closing half of the offer → enter → resolve loop: when the player enters a
 * pending beat, this modal presents it and lets them resolve it. Resolution applies
 * the beat's grants into `unlockedActionIds` and clears `pending` (engine:
 * `resolvePendingBeat`).
 *
 * Two shapes:
 *  - **Non-selection beats** (spine / introduction / investment / delivery) present a
 *    single "receive" action. `onResolve()` grants all of the beat's `grantsActionIds`.
 *  - **Selection beats** render a generic **choose-1-of-N** picker over the beat's
 *    `grantsActionIds`; `onResolve(chosenActionId)` grants exactly the chosen card.
 *
 * SCOPE NOTE. The scripted onboarding spine (Beats 0–4) ships authored Threadbare-voice
 * copy via `SPINE_BEAT_PRESENTATION` (THR-504), preferred over the generic kind-derived
 * placeholder below. The rich, prose-authored encounter-screen path for the *pool*
 * (template-backed beats with `enrichProse` placeholders for generated culture/faction
 * names) remains content work — TODO(THR-514). Until a pool beat declares a real
 * `templateId` + prose, those still render kind-derived copy so the loop stays playable
 * and inspectable end-to-end.
 */

import { memo, useMemo } from 'react';
import { Modal } from '../shared/Modal';
import { BEAT_MODAL_M_MIN_CARDS, type DialogSize } from '../shared/dialogSize';
import { useRefRouterContext } from '../../contexts/RefRouterContext';
import type { WorldRef } from '../../types/worldRef';
import { RevealCard } from '../shared/RevealCard';
import { ActionCard } from './ActionCard';
import { CARD_WIDTH_PX } from '../shared/CardFace';
import type { WheelSlot } from '../../engine/wheel';
import type { PendingBeat, BeatKind } from '../../types/ascendantBeat';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import { getBeatDefinitionById } from '../../engine/ascendantBeat';
import { SPINE_BEAT_PRESENTATION, fillSpineAvatarName, fillSpineSeatLine, isSpineBeatId, type SpineBeatPresentation, type SpineSeatPreview } from '../../data/ascendant-beat-content';
import { Tooltip } from '../shared/Tooltip';
import { DEEPENING_BEAT_PRESENTATION } from '../../data/ascendant-deepening-beats';
import { MILESTONE_BEAT_PRESENTATION } from '../../data/ascendant-milestone-beats';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { actionEffectsProse } from '../../data/actionEffectsProse';
import { ACTION_SCALE_WORDS } from '../../data/action-card-display';
import { playerFacingTemplateName } from '../../engine/unifiedActionResolution';
import { UI_TOOLTIPS } from '../../data/ui-content';
import {
  OFFERING_COPY,
  OFFERING_TOOLTIP_IDS,
  RUNG_BEAT_PRESENTATION,
  RUNG_LATER_KEY_PRESENTATION,
  RUNG_GIFT_UNNAMED_CARD,
} from '../../data/god-progression-content';
import { isRungOpeningGift, parseRungGiftBeatId, type OfferedCardView } from '../../engine/godProgression';

// ─── Props ──────────────────────────────────────────────────────────

interface AscendantBeatModalProps {
  open: boolean;
  pending: PendingBeat;
  /** Resolve the beat. For `selection` beats pass the chosen action id. */
  onResolve: (chosenActionId?: string) => void;
  /**
   * Dismiss without resolving. Pool beats are optional — they remain pending and the
   * offer affordance reappears. Omitted for spine beats (onboarding is not missable).
   */
  onClose?: () => void;
  /**
   * Run-specific title + body for template-backed pool beats (THR-514). `GameView`
   * resolves the beat's `templateId` to its content template and runs the prose through
   * `enrichProse` against the god's anchor mortal, so names read bespoke each run. When
   * present, overrides the kind-derived placeholder copy. Spine beats keep their authored
   * `SPINE_BEAT_PRESENTATION` and never pass this.
   */
  proseOverride?: { title: string; prose: string };
  /** The avatar's name, filled into authored spine prose (Beat 0 — THR-1609). */
  avatarName?: string;
  /** THR-2057: the seat The Seat beat will take (`previewHomeSeat`), named in its prose. */
  seatPreview?: SpineSeatPreview;
  /**
   * THR-1811: an offering's cards with what each costs the god now (`describeOffering`).
   * GameView computes it from live state, so the price words match `getGodProgression()`.
   */
  offering?: readonly OfferedCardView[];
  /** THR-1811: a rung gift is its rung's first given key (isRungOpeningOffer), so it carries the rung's words. */
  rungOpening?: boolean;
  /**
   * THR-1855: the card this beat's reach-signature slot will grant
   * (`previewReachSignatureGrant`). The slot resolves per god, so the beat's static
   * `grantsActionIds` cannot name it; without this the modal showed no card and the
   * rung prose said "this one" about nothing. Shown on a reveal, never in a picker:
   * a selection beat grants it unconditionally, so it is not one of the choices.
   */
  signatureGrantId?: string | null;
  /**
   * THR-1851: the people an introduction beat names. When present, "Attend" resolves the
   * beat and then opens that people's sheet — the popup used to lead nowhere.
   */
  subjectRef?: WorldRef;
}

// ─── Kind-derived presentation (placeholder until THR-514 prose) ─────

interface BeatPresentation {
  eyebrow: string;
  prose: string;
  cta: string;
}

const KIND_PRESENTATION: Record<BeatKind, BeatPresentation> = {
  spine: {
    eyebrow: 'A divine cadence',
    prose: 'The world turns its face toward you, and for a moment the weave is yours to touch.',
    cta: 'Receive',
  },
  introduction: {
    eyebrow: 'The world calls',
    prose: 'A people you have not yet known lifts its voice upward, asking to be seen.',
    cta: 'Attend',
  },
  investment: {
    eyebrow: 'An offering',
    prose: 'Something in the world stands ready to receive your touch — a soul, a place, a thing.',
    cta: 'Bestow',
  },
  selection: {
    eyebrow: 'A path opens',
    prose: 'Several shapes of power lie before you. Choose what you will become.',
    cta: 'Choose',
  },
  delivery: {
    eyebrow: 'A vision',
    prose: 'A scene unfolds before you, delivered not by mortal pathing but by your own sight.',
    cta: 'Witness',
  },
  deepening: {
    eyebrow: 'A deepening',
    prose: 'The world has learned the shape of your will. Where once your urging only leaned, now it commands — something has decided you are to be obeyed in this.',
    cta: 'Receive',
  },
  milestone: {
    eyebrow: 'A wellspring',
    prose: 'What you hold in the world has stopped merely belonging to you and started paying you back. A reach you had not thought to use is open to you now.',
    cta: 'Receive',
  },
  offering: {
    eyebrow: OFFERING_COPY.modalEyebrow,
    prose: OFFERING_COPY.prose,
    cta: OFFERING_COPY.letPass,
  },
  rung_gift: {
    eyebrow: RUNG_LATER_KEY_PRESENTATION.eyebrow,
    prose: RUNG_LATER_KEY_PRESENTATION.prose,
    cta: RUNG_LATER_KEY_PRESENTATION.cta,
  },
};

/**
 * THR-1811: a rung-gift beat's words. The rung's opening gift carries that rung's
 * growth line; a later key says "a further gift" and names the card. Null for any
 * other beat id.
 */
function rungGiftPresentation(beatId: string, cardName: string | undefined, opening?: boolean): SpineBeatPresentation | null {
  const parsed = parseRungGiftBeatId(beatId);
  if (!parsed) return null;
  const words = (opening ?? isRungOpeningGift(beatId)) ? RUNG_BEAT_PRESENTATION[parsed.rung] : undefined;
  const base = words ?? RUNG_LATER_KEY_PRESENTATION;
  return { ...base, prose: base.prose.replace('{card}', cardName ?? RUNG_GIFT_UNNAMED_CARD) };
}

/** The name the gift's card face prints (its spell name when it has one), so the prose names the card shown. */
function firstGrantName(actionId: string | undefined): string | undefined {
  const template = actionId ? getUnifiedTemplateById(actionId) : undefined;
  return template ? playerFacingTemplateName(template) : undefined;
}

/**
 * Every authored, beat-id-keyed presentation, merged into one lookup (THR-613 §5.C).
 *
 * The scripted spine (THR-504), the per-reach Deepening vignettes (Slice 2) and the
 * essence-source Milestone vignette (Slice 2b) all share `SpineBeatPresentation`'s
 * shape and all key by `beatId`, so one table serves them. Authored copy always wins
 * over the kind-derived placeholder below: without this, a Deepening resolved to the
 * same "the world has learned the shape of your will" card for all eight reaches, and
 * the reach-flavored prose the content slices shipped never reached the player.
 *
 * Ids are disjoint by construction (`beat.spine.*` / `beat.deepening.*` /
 * `beat.milestone.*`); a contract test pins that so a future collision cannot silently
 * shadow one table with another.
 */
const AUTHORED_BEAT_PRESENTATION: Readonly<Record<string, SpineBeatPresentation>> = {
  ...SPINE_BEAT_PRESENTATION,
  ...DEEPENING_BEAT_PRESENTATION,
  ...MILESTONE_BEAT_PRESENTATION,
};

/** Title-case the most specific segment of a dotted beat id, e.g. `…the_worthy_mortal` → "The Worthy Mortal". */
function humanizeBeatId(beatId: string): string {
  const tail = beatId.split('.').pop() ?? beatId;
  return tail
    .split('_')
    .map(w => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

// ─── Unlock-reveal cards (THR-639) ──────────────────────────────────

/**
 * Max cards per row before wrapping to a second row.
 *
 * Four, not three, since THR-1002: the card is one size now — `CARD_WIDTH_PX`,
 * the width the whole game's cards share — where the reveal used to scale a
 * 400×560 focused frame down to 80%. A scaled card is a *different* card at a
 * glance (its type is smaller than every other card's), so the scale wrapper went
 * with the frame it was compensating for.
 */
const UNLOCK_CARD_ROW_MAX = 4;
/**
 * Gap between reveal cards — the hand's own gap (`NudgePhaseShell`'s 12 px), so a
 * row of four (4 × 210 + 3 × 12 = 876 px) fits inside the M tier (THR-1820).
 */
const UNLOCK_CARD_GAP_PX = 12;

/** A card row never runs wider than `UNLOCK_CARD_ROW_MAX` cards; more wrap to the next row. */
const UNLOCK_CARD_ROW_MAX_WIDTH_PX = UNLOCK_CARD_ROW_MAX * CARD_WIDTH_PX + (UNLOCK_CARD_ROW_MAX - 1) * UNLOCK_CARD_GAP_PX;

/**
 * Build a display-only WheelSlot from an action template so the real focused
 * ActionCard renders unmodified (THR-639). `state: available` (full brightness); the
 * card is made non-interactive via ActionCard's `interactive` prop, not this slot.
 * Uses the bare template id so art (`getActionArt`) and the type line resolve exactly
 * as they do for the Action Drawer's focused card.
 */
export function templateToPreviewSlot(template: UnifiedActionTemplate): WheelSlot {
  return {
    id: template.id,
    label: template.name,
    type: 'target_action',
    angleDeg: 0,
    available: true,
    lockedReason: null,
    essenceCost: template.essenceCost ?? 0,
    sphere: template.sphereAffinity ?? null,
    interventionType: null,
    rangeStatus: 'unlimited',
    hexDistance: null,
    // THR-1040: fail-soft — `narrativeTemplates` is required on the type but
    // omitted by whole faction sets (the `mc.*` set), so an unguarded read
    // crashes the render rather than degrading it.
    description: template.narrativeTemplates?.initiation ?? '',
    durationMode: template.durationMode,
    spellName: template.spellName,
    technicalDescription: template.description,
    effectsLine: actionEffectsProse(template),
    narrativeLayer: template.narrativeLayer as WheelSlot['narrativeLayer'],
    rarityTier: template.rarityTier,
    // THR-1002: the face's own fields. The reveal shows the card the player is
    // being *given*, so it must be the card they will hold — same verb chip, same
    // scale chip, same reach mark. No `forecastTier`: a reveal has no target and
    // no roll behind it, and the face omits the odds zone rather than guessing.
    templateId: template.id,
    crudType: template.crudType,
    reach: template.reach,
    scale: template.scale ?? null,
    scaleWord: ACTION_SCALE_WORDS[template.scale] ?? undefined,
  };
}

/**
 * The dialog tier for a beat showing `cardCount` cards (THR-1820): S below
 * `BEAT_MODAL_M_MIN_CARDS`, M from there — M holds a row of `UNLOCK_CARD_ROW_MAX`.
 */
export function beatModalSize(cardCount: number): DialogSize {
  return cardCount >= BEAT_MODAL_M_MIN_CARDS ? 'm' : 's';
}

const TEXT_FALLBACK_STYLE: React.CSSProperties = {
  background: 'var(--dlg-inset, var(--bg-surface))',
  border: '1px solid var(--border-subtle)',
  borderRadius: '6px',
  padding: 'var(--space-3)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  textAlign: 'center',
  alignSelf: 'center',
};

/**
 * A wrapping row of focused ActionCards, one per granted action id. Non-selection
 * beats pass `interactive={false}` (pure reveal — the footer button resolves); selection
 * beats pass `interactive` + `onPick` so clicking a card chooses it. Fail-soft: a granted
 * id with no template renders a text line and warns (plan fail-soft table row 1).
 */
function UnlockCardRow({
  actionIds,
  interactive,
  onPick,
}: {
  actionIds: readonly string[];
  interactive: boolean;
  onPick?: (actionId: string) => void;
}) {
  return (
    <div
      data-testid={interactive ? 'beat-selection-picker' : 'beat-unlock-cards'}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: `${UNLOCK_CARD_GAP_PX}px`,
        justifyContent: 'center',
        maxWidth: UNLOCK_CARD_ROW_MAX_WIDTH_PX,
        marginInline: 'auto',
        alignItems: 'flex-start',
      }}
    >
      {actionIds.map(actionId => {
        const template = getUnifiedTemplateById(actionId);
        if (!template) {
          // THR-2101 (S5.5, Law 14): no template means no card name to print, so the row is
          // dropped rather than showing the raw action id; the warning stays.
          console.warn(
            `[AscendantBeatModal] no template for granted action "${actionId}" — row dropped.`,
          );
          return null;
        }
        const slot = templateToPreviewSlot(template);
        return (
          <div
            key={actionId}
            data-action-id={actionId}
            style={{ width: CARD_WIDTH_PX, flex: '0 0 auto', display: 'flex' }}
          >
            <ActionCard
              slot={slot}
              interactive={interactive}
              onClick={() => onPick?.(actionId)}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

// EYEBROW_STYLE was retired in THR-799 — `RevealCard.Title` now carries the
// category line, including its letterspaced display caps and flanking rules.

const PRIMARY_BUTTON_STYLE: React.CSSProperties = {
  background: 'var(--accent-gold)',
  color: 'var(--bg-deep)',
  border: 'none',
  borderRadius: '4px',
  padding: 'var(--space-2) var(--space-6)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
  fontWeight: 700,
};

const SECONDARY_BUTTON_STYLE: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px',
  padding: 'var(--space-2) var(--space-6)',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
};

const PRICE_TOOLTIP_BY_WORD: Record<OfferedCardView['word'], string> = {
  paid_from: OFFERING_TOOLTIP_IDS.paidFrom,
  at_double: OFFERING_TOOLTIP_IDS.atDouble,
  beyond: OFFERING_TOOLTIP_IDS.beyond,
};

/**
 * THR-1811: the offering's cards, each with its price phrase (no number — Law 13) and a
 * *Take it up* button; a card the god cannot pay for shows the button disabled with its
 * reason (Law 25). The same `ActionCard` faces as every reveal (Laws 26–27, 30).
 */
function OfferingRow({
  cards,
  onTakeUp,
}: {
  cards: readonly OfferedCardView[];
  onTakeUp: (actionId: string) => void;
}) {
  return (
    <div
      data-testid="offering-cards"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: `${UNLOCK_CARD_GAP_PX}px`,
        justifyContent: 'center',
        maxWidth: UNLOCK_CARD_ROW_MAX_WIDTH_PX,
        marginInline: 'auto',
        alignItems: 'flex-start',
      }}
    >
      {cards.map(card => {
        const template = getUnifiedTemplateById(card.actionId);
        const tip = UI_TOOLTIPS[PRICE_TOOLTIP_BY_WORD[card.word]];
        return (
          <div
            key={card.actionId}
            data-action-id={card.actionId}
            data-price-word={card.word}
            style={{ width: CARD_WIDTH_PX, flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}
          >
            {template ? (
              <ActionCard slot={templateToPreviewSlot(template)} interactive={false} onClick={() => undefined} />
            ) : (
              <div style={TEXT_FALLBACK_STYLE}>{card.name}</div>
            )}
            <Tooltip label={tip?.label ?? card.phrase} desc={tip?.desc ?? ''} focusable={false} fit>
              <span
                data-testid="offering-price"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  fontSize: 'var(--text-sm)',
                  color: card.affordable ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontStyle: card.affordable ? 'normal' : 'italic',
                }}
              >
                {card.phrase}
              </span>
            </Tooltip>
            <button
              type="button"
              disabled={!card.affordable}
              title={card.affordable ? undefined : tip?.desc}
              onClick={() => { if (card.affordable) onTakeUp(card.actionId); }}
              data-testid="offering-take-up"
              style={{
                ...PRIMARY_BUTTON_STYLE,
                padding: 'var(--space-1) var(--space-4)',
                opacity: card.affordable ? 1 : 0.45,
                cursor: card.affordable ? 'pointer' : 'not-allowed',
              }}
            >
              {card.affordable ? OFFERING_COPY.takeUp : OFFERING_COPY.notYet}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────

export const AscendantBeatModal = memo(function AscendantBeatModal({
  open,
  pending,
  onResolve,
  onClose,
  proseOverride,
  avatarName,
  seatPreview,
  offering,
  rungOpening,
  signatureGrantId,
  subjectRef,
}: AscendantBeatModalProps) {
  const router = useRefRouterContext();
  const def = useMemo(() => getBeatDefinitionById(pending.beatId), [pending.beatId]);
  const isOffering = pending.kind === 'offering';
  // Presentation precedence: authored per-beat copy (spine THR-504 / Deepening / Milestone /
  // rung gifts THR-1811) → enriched template prose for pool beats (THR-514, supplied by
  // GameView) → kind-derived placeholder. Eyebrow + CTA always come from the authored/kind
  // table (templates carry only title + body).
  const isSelection = pending.kind === 'selection';
  const staticGrants = def?.grantsActionIds ?? [];
  const grants = !isSelection && signatureGrantId && !staticGrants.includes(signatureGrantId)
    ? [...staticGrants, signatureGrantId]
    : staticGrants;
  const firstGrant = grants[0];
  const authored = AUTHORED_BEAT_PRESENTATION[pending.beatId]
    ?? rungGiftPresentation(pending.beatId, firstGrantName(firstGrant), rungOpening)
    ?? undefined;
  const kindPresentation = KIND_PRESENTATION[pending.kind] ?? KIND_PRESENTATION.spine;
  const presentation = authored ?? kindPresentation;
  const title = isOffering
    ? OFFERING_COPY.title
    : proseOverride?.title ?? authored?.title ?? humanizeBeatId(pending.beatId);
  const prose = proseOverride?.prose ?? fillSpineSeatLine(fillSpineAvatarName(presentation.prose, avatarName), seatPreview);

  // Backdrop / Esc → dismiss for optional beats; for spine (no onClose) it stays put.
  const handleClose = onClose ?? (() => { /* spine beats are not dismissable */ });

  // The tier follows the card row (THR-1820): S below three cards, M from three,
  // so a row of up to four focused ActionCards fits without clipping.
  const offered = isOffering ? (offering ?? []) : [];
  const size = beatModalSize(isOffering ? offered.length : grants.length);

  return (
    // THR-799: this surface adopts the ceremonial *zone layout* via RevealCard.Frame,
    // not a second RevealCard modal — it is already a Modal, and nesting one would
    // double-portal and stack two backdrops. `.frame-ceremonial` rides on the panel
    // through Modal's panelClassName, so the double frame comes from the same place
    // a standalone RevealCard gets it.
    <Modal
      open={open}
      onClose={handleClose}
      size={size}
      aria-label={`Ascendant beat: ${title}`}
      context="story"
      panelClassName="frame-ceremonial"
    >
      {/* Zones scroll; the resolve button is pinned below so a tall card row can
          never push it past the panel edge. */}
      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
        <RevealCard.Frame>
          <RevealCard.Title>{presentation.eyebrow}</RevealCard.Title>
          <RevealCard.Banner>{title}</RevealCard.Banner>

          {/* Narrative before mechanics — the beat's prose leads, the cards follow. */}
          <RevealCard.Quote>{prose}</RevealCard.Quote>

          {isOffering ? (
            <OfferingRow cards={offered} onTakeUp={id => onResolve(id)} />
          ) : isSelection ? (
            // Selection beat: real focused cards, clickable — choosing a card resolves it.
            <UnlockCardRow actionIds={grants} interactive onPick={onResolve} />
          ) : (
            // Non-selection beat: real focused cards as a pure reveal; the button resolves.
            grants.length > 0 && <UnlockCardRow actionIds={grants} interactive={false} />
          )}
        </RevealCard.Frame>
      </div>
      {isOffering && (
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-ceremonial)',
            paddingTop: 0,
          }}
        >
          <button
            type="button"
            onClick={() => onResolve()}
            style={SECONDARY_BUTTON_STYLE}
            data-testid="offering-let-pass"
          >
            {OFFERING_COPY.letPass}
          </button>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }} data-testid="offering-footer">
            {OFFERING_COPY.footer}
          </span>
        </div>
      )}
      {!isSelection && !isOffering && (
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'center',
            padding: 'var(--space-ceremonial)',
            paddingTop: 0,
          }}
        >
          <button
            type="button"
            onClick={() => {
              onResolve();
              // THR-1851: attending a people means meeting them — open their sheet.
              if (subjectRef && router) router.open(subjectRef, 'sheet', { via: 'beat' });
            }}
            style={PRIMARY_BUTTON_STYLE}
            data-testid="beat-resolve-button"
          >
            {presentation.cta}
          </button>
        </div>
      )}
    </Modal>
  );
});

// ─── The offer, as Needs you names it (THR-1875) ─────────────────────

/**
 * Stacking band of the Needs-you pill while it carries a held opening gift (THR-1809):
 * above the player surfaces that hold the gift (`Modal` at 60) so it stays visible over
 * them, below a sheet raised over an interrupt (65) and tooltips (70+). Row in
 * `layout-zones.md`. THR-1875 moved the raise from the retired floating offer pill to
 * the top bar's Needs-you pill (frame plan § F4).
 */
export const GIFT_PILL_Z = 62;

/**
 * THR-1875 (frame plan § F5) — what the pending beat is called in Needs you's Waiting
 * group: its kind for the row's line, and the authored eyebrow (the same precedence as
 * the modal, so the row and the card it opens agree). Never the beat id (PC-3).
 */
export function beatOfferWords(pending: PendingBeat): { kind: 'gift' | 'offering' | 'beat'; eyebrow: string } {
  const eyebrow =
    AUTHORED_BEAT_PRESENTATION[pending.beatId]?.eyebrow ??
    (KIND_PRESENTATION[pending.kind] ?? KIND_PRESENTATION.spine).eyebrow;
  if (pending.kind === 'offering') return { kind: 'offering', eyebrow };
  if (isSpineBeatId(pending.beatId)) return { kind: 'gift', eyebrow };
  return { kind: 'beat', eyebrow };
}
