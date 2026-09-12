/**
 * NudgePhaseShell — THR-775 (WS2 interface).
 *
 * The nudge encounter stage: motive strip, test panel, the hand, and the commit
 * that hands the step to fate. Rendered *inside* the existing EncounterVeil in
 * place of the legacy choice blocks — no new mount, no new modal host, and the
 * THR-668 interrupt registration is inherited from the veil.
 *
 * **Words, never numerals.** The difficulty, the forecast, and the tolls all
 * render as words (ruling 6). The numbers exist on the model for the designer
 * view alone, which lives in the DebugPanel and is off by default.
 *
 * Plan: `Docs/plans/2026-07-27-nudge-encounter-experience-ws1-ws2.md` § WS2
 */

import { useSyncExternalStore } from 'react';
import { EntityVisual } from '../../../shared/EntityVisual';
import { Tooltip } from '../../../shared/Tooltip';
import { CostPips } from '../../../shared/OddsPips';
import { CardFace, HAND_MAX_HEIGHT_PX } from '../../../shared/CardFace';
import { formatEssencePool } from '../../../shared/formatEssence';
import { gradientIndexForId } from '../../../../data/entity-visual-fallbacks';
import { resolveEncounterImagePath } from '../../../../data/encounterImageResolver';
import { NUDGE_GLYPH_LEGEND } from '../../../../data/nudge-card-display';
import {
  NUDGE_BLOCKED_REASONS,
  NUDGE_COMMIT_LABEL,
  NUDGE_EMPTY_HAND_LINE,
  NUDGE_HAND_HEADING,
} from '../../../../data/nudge-stage-content';
import { NudgeMotiveIntro } from './NudgeMotiveIntro';
import { NudgeBalance, NudgeReadingMarks } from './NudgeStageHeader';
import {
  isNudgeDesignerViewEnabled,
  subscribeNudgeDesignerView,
} from '../designerView';
import { useNudgeHand, type NudgeHandCard, type UseNudgeHandResult } from '../useNudgeHand';
import type { EncounterStageNudgePhaseModel } from '../types';

// ── Design tokens (the veil's ceremonial palette — Law 30, THR-1010) ───────
// These name the same tokens `EncounterVeil.tsx` uses; the values live in
// `index.css`. Previously both files declared their own `#d4af37`, which had
// drifted from `--accent-gold`. `TEXT_WHISPER` also rose to WCAG AA here
// (Law 45) — in this shell it carries the forecast qualifier, the factor
// sentences and the remaining-essence line, all of them information.
const GOLD = 'var(--veil-gold)';
const TEXT_WARM = 'var(--veil-text-warm)';
const TEXT_WHISPER = 'var(--veil-text-whisper)';
const FONT_PROSE = 'var(--font-prose)';
const FONT_DISPLAY = "'Palatino Linotype', 'Book Antiqua', Palatino, serif";

// ── The reading moved out (THR-1478) ───────────────────────────────
// The reach chip, the difficulty unit, the forecast and the factor lines now
// live in `NudgeStageHeader`, because `EncounterVeil` renders them *above* its
// prose — inside its own context strip — and this shell cannot reach that
// subtree from inside itself. The tokens and constants they used went with
// them. The standalone path below draws the same two components, so there is
// one implementation of the reading and two placements of it.

// ── Legend glyph size ──────────────────────────────────────────────
// The card's own glyph sizes moved to `shared/CardFace` with the zones that
// used them (THR-1002); the legend is the shell's, not the card's.

/** Legend glyphs under the hand heading. */
const LEGEND_GLYPH_PX = 12;

export interface NudgePhaseShellProps {
  phase: EncounterStageNudgePhaseModel;
  /** Focal agent portrait, when the header resolved one. */
  portraitUrl?: string | null;
  agentName?: string;
  /**
   * Focal agent's node id, for the portrait's resolver lookup and its stable
   * fallback-gradient identity. Absent ⇒ the action id stands in, which still
   * renders but gives the tile a per-encounter colour rather than a per-agent one.
   */
  focalActorId?: string;
  /** Commit the selected hand and let the step resolve. */
  onCommit: (nudgeIds: string[], essenceCost: number) => void;
  /** Open the motive explainer. Absent ⇒ the line renders as static text. */
  onOpenMotive?: (phase: EncounterStageNudgePhaseModel) => void;
  /**
   * Render the motive intro line inside this shell (THR-972).
   *
   * Defaults to true so a host that mounts the shell whole — the meeting beats —
   * keeps the line without changing. `EncounterVeil` passes **false**, because it
   * renders `NudgeMotiveIntro` itself, above its prose block, which is the
   * placement the directive asked for and which this shell cannot reach from
   * inside its own subtree.
   */
  renderMotiveIntro?: boolean;
  /**
   * Render the reading — reach, difficulty, forecast, factor lines — inside this
   * shell (THR-1478).
   *
   * Same shape as {@link renderMotiveIntro}, for the same reason. Defaults to
   * true so a host that mounts the shell whole (the meeting beats) keeps the
   * panel. `EncounterVeil` passes **false** and draws the marks inside its own
   * context strip above the prose, which is the merge the director asked for.
   */
  renderTestHeader?: boolean;
  /**
   * Externally-owned hand state (THR-1478).
   *
   * The merged header shows the *live* forecast, which moves as cards toggle —
   * so the veil, which renders that header, has to own the selection the cards
   * change. When supplied, this shell drives that hand instead of its own; the
   * single source of truth is what keeps the die above the prose and the cards
   * below it from ever disagreeing.
   */
  hand?: UseNudgeHandResult;
}

// ── Card ───────────────────────────────────────────────────────────

/**
 * One card of the hand.
 *
 * Exported for the Package View (THR-1046), which draws the same row from a
 * statically-built model so a designer reviewing an encounter sees the card the
 * *player* will see rather than a second rendering of the same fields. Pass
 * `card.interactive: false` there — the card is a display of authored content,
 * not a control, and a designer surface must not offer a commit that cannot fire.
 */
export function NudgeCard({
  card,
  designerView,
  onToggle,
}: {
  card: NudgeHandCard;
  designerView: boolean;
  onToggle: () => void;
}) {
  const dimmed = card.state === 'dimmed' && !card.selected;
  // THR-777: manifest lookup on the authored tag, sphere as a refinement.
  // THR-832 batch 2 generated the 16 nudge concept generics and gave the kind a
  // category generic, so this now resolves for every card in practice.
  const artPath = resolveEncounterImagePath({
    tag: card.imageTag,
    kind: 'nudge',
    sphere: card.sphere,
  });

  // THR-1002: the zone stack moved to `shared/CardFace` so the action card draws
  // the same face. This adapter is all that remains of the nudge card, and its
  // DOM is pinned by `NudgeCard.snapshot.test.tsx`, written before the
  // extraction — if that snapshot moves, the primitive is wrong, not the pin.
  return (
    <CardFace
      designerView={designerView}
      onToggle={onToggle}
      model={{
        id: card.id,
        testIdPrefix: 'nudge-card',
        dataAttributes: {
          'data-nudge-state': card.selected ? 'selected' : card.state,
          'data-nudge-blocked': card.blockedCode ?? '',
          'data-nudge-keyword': card.keyword ?? '',
        },
        picture: {
          tier: artPath ? 'art' : 'fallback',
          // `src` present ⇒ art tier; the glyph stays populated either way
          // because EntityVisual uses it as the <img> onError swap target.
          ...(artPath ? { src: artPath } : {}),
          glyph: card.keywordIcon ?? (card.sphere ? '◈' : '◇'),
          gradientIndex: gradientIndexForId(card.id),
          alt: card.name,
          kind: 'encounter',
        },
        ...(card.keyword ? { keyword: { label: card.keyword, icon: card.keywordIcon } } : {}),
        ...(card.sphere ? { sphere: card.sphere } : {}),
        cost: card.essenceCost,
        costEmphasised: dimmed && card.blockedCode === 'essence_unavailable',
        ...(card.costChannels ? { costChannels: card.costChannels } : {}),
        ...(card.provenance ? { provenance: card.provenance } : {}),
        name: card.name,
        effectLine: card.effectLine,
        // A nudge *moves* the odds, so it reads them as pips (Law 10).
        odds: { kind: 'delta', value: card.forecastDelta },
        ...(card.blockedReason ? { blockedReason: card.blockedReason } : {}),
        selected: card.selected,
        dimmed,
        disabled: !card.interactive,
        designerLine: (
          <>
            Δ{card.forecastDelta.toFixed(3)}
            {card.discounted ? ' · discounted' : ''}
            {card.riderLabel ? ` · ${card.riderLabel}` : ''}
          </>
        ),
      }}
    />
  );
}

// ── Shell ──────────────────────────────────────────────────────────

export function NudgePhaseShell({
  phase,
  portraitUrl,
  agentName,
  focalActorId,
  onCommit,
  onOpenMotive,
  renderMotiveIntro = true,
  renderTestHeader = true,
  hand: externalHand,
}: NudgePhaseShellProps) {
  const designerView = useSyncExternalStore(
    subscribeNudgeDesignerView,
    isNudgeDesignerViewEnabled,
    // Server snapshot — the stage never renders server-side, but the third
    // argument keeps `useSyncExternalStore` from warning under test renderers.
    isNudgeDesignerViewEnabled,
  );

  // Hooks cannot be called conditionally, but their *arguments* can: passing
  // `undefined` when a host owns the hand takes the documented fail-soft path
  // (an inert hand) rather than standing up a second selection state that would
  // silently diverge from the one the header is reading.
  const ownHand = useNudgeHand(externalHand ? undefined : phase);
  const hand = externalHand ?? ownHand;
  const { testPanel } = phase;

  return (
    <div data-testid="nudge-phase-shell" style={{ marginTop: 24 }}>
      {/* ── Motive ──────────────────────────────────────────────
          THR-972 moved the motive out of this shell entirely. It now renders as
          the scene's opening line *above* the veil's prose (`NudgeMotiveIntro`),
          which is a different subtree — the chip+sentence strip that used to sit
          here could only ever appear below the fiction it was framing.

          `renderMotiveIntro` lets a host that has no prose block of its own (the
          meeting beats, which mount this shell whole) keep the line inside the
          shell rather than losing it. EncounterVeil passes false and mounts the
          line itself. */}
      {renderMotiveIntro && (
        <div style={{ marginBottom: 18 }}>
          <NudgeMotiveIntro phase={phase} onOpen={onOpenMotive} />
        </div>
      )}

      {/* ── The reading (THR-1478) ──────────────────────────────
          One block, and on the veil's path it is not this one. `EncounterVeil`
          passes `renderTestHeader={false}` and draws the same two components
          inside its context strip above the prose — the merge the director
          asked for, which also retires the second portrait and the second reach
          icon that used to sit down here.

          What remains is the standalone placement: the meeting beats mount this
          shell with no context strip above them, so the panel is where their
          reading lives. Portrait, then marks, then the balance beneath. */}
      {renderTestHeader && (
        <div
          data-testid="nudge-test-panel"
          style={{
            display: 'flex',
            gap: 18,
            padding: '14px 16px',
            borderRadius: 10,
            border: '1px solid rgb(var(--veil-gold-rgb) / 0.15)',
            background: 'rgba(255, 255, 255, 0.015)',
          }}
        >
          {/* THR-972 directive 1, option (a): the slot is the *agent's*
              portrait, not an encounter-image placeholder, so it resolves like
              one — inheriting the shared knowledge gate and the same bespoke →
              archetype source chain the veil header uses. Gradient identity keys
              on the agent rather than the action, so the same mortal keeps their
              fallback colour across encounters. */}
          <EntityVisual
            size="portrait"
            entity={{
              id: focalActorId ?? phase.actionId,
              kind: 'agent',
              name: agentName ?? 'The mortal',
              knownSrc: portraitUrl,
            }}
            data-testid="nudge-actor-portrait"
            aria-label={agentName ?? 'The mortal'}
            style={{ width: 64, flexShrink: 0 }}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <NudgeReadingMarks
                testPanel={testPanel}
                forecast={hand.forecast}
                baseForecast={hand.baseForecast}
                forecastMoved={hand.forecastMoved}
                designerView={designerView}
              />
            </div>
            <NudgeBalance testPanel={testPanel} />
          </div>
        </div>
      )}

      {/* ── The hand ───────────────────────────────────────────── */}
      <div style={{ marginTop: 22 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
          <Tooltip id="ui.nudge_hand">
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 'var(--text-sm)', color: TEXT_WARM, letterSpacing: '0.08em' }}>
              {NUDGE_HAND_HEADING}
            </span>
          </Tooltip>
          {/* Rounded down: promising essence the player cannot actually spend
              is worse than under-reporting a fraction of it. */}
          <Tooltip id="ui.nudge_essence">
            <span data-testid="nudge-remaining-essence" style={{ fontSize: 'var(--text-xs)', color: TEXT_WHISPER }}>
              {formatEssencePool(hand.remainingEssence)} essence left
            </span>
          </Tooltip>

          {/* ── Glyph legend (THR-972 directive 5) ────────────────
              *"help me understand which is which."* Naming the three vocabularies
              once, where the hand begins, costs one line and removes the guess.
              Each entry pairs the glyph with the noun it means, so this is a key
              *to a symbol set* rather than a `label: value` readout — the pattern
              the project treats as unfinished UX. Sits at the right of the
              heading row so it reads as chrome on the hand, not as a card. */}
          <Tooltip id="ui.nudge_glyphs">
            <span
              data-testid="nudge-glyph-legend"
              style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}
            >
              {NUDGE_GLYPH_LEGEND.map((entry) => (
                <span
                  key={entry.id}
                  data-testid={`nudge-legend-${entry.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: TEXT_WHISPER }}
                >
                  <span aria-hidden="true" style={{ fontSize: LEGEND_GLYPH_PX, lineHeight: 1 }}>
                    {entry.glyph}
                  </span>
                  {entry.label}
                </span>
              ))}
            </span>
          </Tooltip>
        </div>

        {hand.cards.length === 0 ? (
          <p style={{ fontFamily: FONT_PROSE, fontStyle: 'italic', color: TEXT_WHISPER, margin: 0 }}>
            {NUDGE_EMPTY_HAND_LINE}
          </p>
        ) : (
          <div
            data-testid="nudge-card-row"
            style={{
              display: 'flex',
              // One line, scrolled sideways — a *row*, not a grid.
              //
              // Wrapping was tried first and measured worse: the stage column
              // fits four cards, so a five-card hand wrapped to a second line
              // that the height cap then clipped mid-card. Scrolling the axis the
              // cards are laid out along keeps every card whole and legible, and
              // still satisfies the viewport contract — what that contract forbids
              // is the *page* scrolling, which this prevents by capping height.
              flexWrap: 'nowrap',
              // Cards match the tallest in the row, so quotes line up across it.
              alignItems: 'stretch',
              gap: 12,
              maxHeight: HAND_MAX_HEIGHT_PX,
              overflowX: 'auto',
              overflowY: 'hidden',
              paddingBottom: 6,
            }}
          >
            {hand.cards.map((card) => (
              <NudgeCard
                key={card.id}
                card={card}
                designerView={designerView}
                onToggle={() => hand.toggle(card.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Designer view: the cards the player never sees ─────── */}
      {designerView && phase.withheld.length > 0 && (
        <div
          data-testid="nudge-designer-withheld"
          style={{
            marginTop: 18,
            padding: '10px 12px',
            border: '1px dashed rgb(var(--veil-gold-rgb) / 0.25)',
            borderRadius: 8,
          }}
        >
          <div style={{ fontSize: 'var(--text-xs)', color: TEXT_WHISPER, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            Withheld from the player stage
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontFamily: 'monospace', fontSize: 'var(--text-xs)', color: TEXT_WARM }}>
            {phase.withheld.map((entry) => (
              <li key={entry.id} data-testid={`nudge-withheld-${entry.id}`}>
                {entry.name} — {NUDGE_BLOCKED_REASONS[entry.blockedCode]} ({entry.blockedCode})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Commit ─────────────────────────────────────────────── */}
      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          type="button"
          className="focus-ring"
          data-testid="nudge-commit"
          onClick={() => onCommit(hand.selectedIds, hand.selectedCost)}
          style={{
            padding: '10px 22px',
            borderRadius: 8,
            border: `1px solid ${GOLD}`,
            background: 'rgb(var(--veil-gold-rgb) / 0.1)',
            color: GOLD,
            fontFamily: FONT_DISPLAY,
            fontSize: 'var(--text-base)',
            letterSpacing: '0.06em',
            cursor: 'pointer',
          }}
        >
          {NUDGE_COMMIT_LABEL}
        </button>
        {/* The running price of the selection, in the same pips the cards quote —
            the player should never have to convert between two cost notations to
            check what they are about to spend. The remaining-essence counter above
            stays a numeral: it is a pool balance, not a card face, and a
            forty-glyph row would be unreadable. */}
        {hand.selectedCost > 0 && (
          <span
            data-testid="nudge-selected-cost"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: TEXT_WARM }}
          >
            <CostPips cost={hand.selectedCost} size={13} />
          </span>
        )}
      </div>
    </div>
  );
}
