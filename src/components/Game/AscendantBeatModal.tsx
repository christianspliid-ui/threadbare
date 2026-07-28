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
import { RevealCard } from '../shared/RevealCard';
import { ActionCard } from './ActionCard';
import type { WheelSlot } from '../../engine/wheel';
import type { PendingBeat, BeatKind } from '../../types/ascendantBeat';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import { getBeatDefinitionById } from '../../engine/ascendantBeat';
import { SPINE_BEAT_PRESENTATION, type SpineBeatPresentation } from '../../data/ascendant-beat-content';
import { DEEPENING_BEAT_PRESENTATION } from '../../data/ascendant-deepening-beats';
import { MILESTONE_BEAT_PRESENTATION } from '../../data/ascendant-milestone-beats';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { actionEffectsProse } from '../../data/actionEffectsProse';

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
}

// ─── Kind-derived presentation (placeholder until THR-514 prose) ─────

interface BeatPresentation {
  eyebrow: string;
  prose: string;
  cta: string;
}

const KIND_PRESENTATION: Record<BeatKind, BeatPresentation> = {
  spine: {
    eyebrow: 'A Divine Cadence',
    prose: 'The world turns its face toward you, and for a moment the weave is yours to touch.',
    cta: 'Receive',
  },
  introduction: {
    eyebrow: 'The World Calls',
    prose: 'A people you have not yet known lifts its voice upward, asking to be seen.',
    cta: 'Attend',
  },
  investment: {
    eyebrow: 'An Offering',
    prose: 'Something in the world stands ready to receive your touch — a soul, a place, a thing.',
    cta: 'Bestow',
  },
  selection: {
    eyebrow: 'A Path Opens',
    prose: 'Several shapes of power lie before you. Choose what you will become.',
    cta: 'Choose',
  },
  delivery: {
    eyebrow: 'A Vision',
    prose: 'A scene unfolds before you, delivered not by mortal pathing but by your own sight.',
    cta: 'Witness',
  },
  deepening: {
    eyebrow: 'A Deepening',
    prose: 'The world has learned the shape of your will. Where once your urging only leaned, now it commands — something has decided you are to be obeyed in this.',
    cta: 'Receive',
  },
  milestone: {
    eyebrow: 'A Wellspring',
    prose: 'What you hold in the world has stopped merely belonging to you and started paying you back. A reach you had not thought to use is open to you now.',
    cta: 'Receive',
  },
};

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

/** Focused ActionCard face size — mirrors ActionCard SIZE_CONFIG.focused (400 × 400·7/5). */
const FOCUSED_CARD_W = 400;
const FOCUSED_CARD_H = 560;
/** Scale factor applied to the focused face inside the beat modal. */
const UNLOCK_CARD_SCALE = 0.8;
/** Max cards per row before wrapping to a second row. */
const UNLOCK_CARD_ROW_MAX = 3;
/** Gap between reveal cards. */
const UNLOCK_CARD_GAP_PX = 24;

const SCALED_CARD_W = Math.round(FOCUSED_CARD_W * UNLOCK_CARD_SCALE);
const SCALED_CARD_H = Math.round(FOCUSED_CARD_H * UNLOCK_CARD_SCALE);

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
    detectionRisk: 0,
    sphere: template.sphereAffinity ?? null,
    interventionType: null,
    rangeStatus: 'unlimited',
    hexDistance: null,
    description: template.narrativeTemplates.initiation,
    durationMode: template.durationMode,
    spellName: template.spellName,
    technicalDescription: template.description,
    effectsLine: actionEffectsProse(template),
    narrativeLayer: template.narrativeLayer as WheelSlot['narrativeLayer'],
    rarityTier: template.rarityTier,
  };
}

/** Modal max-width sized to hold up to UNLOCK_CARD_ROW_MAX cards in one row. */
function unlockRowMaxWidth(cardCount: number): number {
  const cols = Math.min(Math.max(cardCount, 1), UNLOCK_CARD_ROW_MAX);
  return Math.max(600, cols * SCALED_CARD_W + (cols - 1) * UNLOCK_CARD_GAP_PX + 96);
}

const TEXT_FALLBACK_STYLE: React.CSSProperties = {
  background: 'var(--bg-surface)',
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
        alignItems: 'flex-start',
      }}
    >
      {actionIds.map(actionId => {
        const template = getUnifiedTemplateById(actionId);
        if (!template) {
          console.warn(
            `[AscendantBeatModal] no template for granted action "${actionId}" — rendering text fallback.`,
          );
          return (
            <div key={actionId} data-action-id={actionId} style={TEXT_FALLBACK_STYLE}>
              You will learn: {actionId}
            </div>
          );
        }
        const slot = templateToPreviewSlot(template);
        return (
          <div
            key={actionId}
            data-action-id={actionId}
            style={{ width: SCALED_CARD_W, height: SCALED_CARD_H, flex: '0 0 auto' }}
          >
            <div
              style={{
                width: FOCUSED_CARD_W,
                height: FOCUSED_CARD_H,
                transform: `scale(${UNLOCK_CARD_SCALE})`,
                transformOrigin: 'top left',
              }}
            >
              <ActionCard
                slot={slot}
                size="focused"
                interactive={interactive}
                onClick={() => onPick?.(actionId)}
              />
            </div>
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
  color: 'var(--bg-base)',
  border: 'none',
  borderRadius: '4px',
  padding: 'var(--space-2) var(--space-6)',
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-sm)',
  letterSpacing: '0.06em',
  cursor: 'pointer',
  fontWeight: 700,
};

// ─── Component ──────────────────────────────────────────────────────

export const AscendantBeatModal = memo(function AscendantBeatModal({
  open,
  pending,
  onResolve,
  onClose,
  proseOverride,
}: AscendantBeatModalProps) {
  const def = useMemo(() => getBeatDefinitionById(pending.beatId), [pending.beatId]);
  // Presentation precedence: authored per-beat copy (spine THR-504 / Deepening / Milestone)
  // → enriched template prose for pool beats (THR-514, supplied by GameView) → kind-derived
  // placeholder. Eyebrow + CTA always come from the authored/kind table (templates carry
  // only title + body).
  const authored = AUTHORED_BEAT_PRESENTATION[pending.beatId];
  const kindPresentation = KIND_PRESENTATION[pending.kind] ?? KIND_PRESENTATION.spine;
  const presentation = authored ?? kindPresentation;
  const grants = def?.grantsActionIds ?? [];
  const isSelection = pending.kind === 'selection';
  const title = proseOverride?.title ?? authored?.title ?? humanizeBeatId(pending.beatId);
  const prose = proseOverride?.prose ?? presentation.prose;

  // Backdrop / Esc → dismiss for optional beats; for spine (no onClose) it stays put.
  const handleClose = onClose ?? (() => { /* spine beats are not dismissable */ });

  // Widen the modal so the focused ActionCard row (up to 3 across) fits without
  // clipping; falls back to the default width when there are no grant cards to show.
  const maxWidth = grants.length > 0 ? unlockRowMaxWidth(grants.length) : 600;

  return (
    // THR-799: this surface adopts the ceremonial *zone layout* via RevealCard.Frame,
    // not a second RevealCard modal — it is already a Modal, and nesting one would
    // double-portal and stack two backdrops. `.frame-ceremonial` rides on the panel
    // through Modal's panelClassName, so the double frame comes from the same place
    // a standalone RevealCard gets it.
    <Modal
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      aria-label={`Ascendant beat: ${title}`}
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

          {isSelection ? (
            // Selection beat: real focused cards, clickable — choosing a card resolves it.
            <UnlockCardRow actionIds={grants} interactive onPick={onResolve} />
          ) : (
            // Non-selection beat: real focused cards as a pure reveal; the button resolves.
            grants.length > 0 && <UnlockCardRow actionIds={grants} interactive={false} />
          )}
        </RevealCard.Frame>
      </div>
      {!isSelection && (
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
            onClick={() => onResolve()}
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

// ─── Offer affordance (world-view thread-tug) ───────────────────────

interface AscendantBeatOfferBannerProps {
  pending: PendingBeat;
  onEnter: () => void;
}

/**
 * The "thread-tug" the player chooses to enter — a quiet top-center pill in the world
 * view when a pool/optional beat is pending (THR-340 handoff pattern, simplified).
 * Spine beats auto-open the modal instead of routing through this affordance.
 */
export const AscendantBeatOfferBanner = memo(function AscendantBeatOfferBanner({
  pending,
  onEnter,
}: AscendantBeatOfferBannerProps) {
  // Same precedence as the modal, so the banner and the card it opens agree.
  const eyebrow =
    AUTHORED_BEAT_PRESENTATION[pending.beatId]?.eyebrow ??
    (KIND_PRESENTATION[pending.kind] ?? KIND_PRESENTATION.spine).eyebrow;
  return (
    <button
      type="button"
      onClick={onEnter}
      data-testid="beat-offer-banner"
      style={{
        position: 'fixed',
        top: 'var(--space-4)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
        border: '1px solid var(--border-gold)',
        borderRadius: '999px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        padding: 'var(--space-2) var(--space-4)',
        cursor: 'pointer',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-sm)',
        letterSpacing: '0.04em',
      }}
    >
      <span aria-hidden style={{ color: 'var(--accent-gold)' }}>✦</span>
      <span style={{ color: 'var(--accent-gold)', textTransform: 'uppercase', fontSize: 'var(--text-xs)', letterSpacing: '0.1em' }}>
        {eyebrow}
      </span>
      <span style={{ color: 'var(--text-secondary)' }}>— {humanizeBeatId(pending.beatId)}</span>
      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Enter ▸</span>
    </button>
  );
});
