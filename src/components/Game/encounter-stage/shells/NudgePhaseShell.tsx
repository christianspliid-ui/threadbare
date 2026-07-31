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
import { SphereIcon } from '../../../shared/SphereIcon';
import { CardKeywordChip } from '../../../shared/CardKeywordChip';
import { CostPips, OddsPips } from '../../../shared/OddsPips';
import { gradientIndexForId } from '../../../../data/entity-visual-fallbacks';
import { resolveEncounterImagePath } from '../../../../data/encounterImageResolver';
import {
  NUDGE_BLOCKED_REASONS,
  NUDGE_COMMIT_LABEL,
  NUDGE_EMPTY_HAND_LINE,
  NUDGE_HAND_HEADING,
} from '../../../../data/nudge-stage-content';
import {
  isNudgeDesignerViewEnabled,
  subscribeNudgeDesignerView,
} from '../designerView';
import { useNudgeHand, type NudgeHandCard } from '../useNudgeHand';
import type { EncounterStageNudgePhaseModel } from '../types';

// ── Design tokens (match the veil's existing palette) ──────────────
const GOLD = '#d4af37';
const TEXT_WARM = 'rgba(212, 196, 158, 0.75)';
const TEXT_WHISPER = 'rgba(180, 170, 150, 0.4)';
const FONT_PROSE = "Georgia, 'Times New Roman', serif";
const FONT_DISPLAY = "'Palatino Linotype', 'Book Antiqua', Palatino, serif";

/** Forecast tier → the colour the word carries. Tier classes, not new colours. */
const FORECAST_TIER_COLORS: Record<string, string> = {
  doomed: '#b91c1c',
  perilous: 'rgba(248, 113, 113, 0.85)',
  uncertain: 'rgba(212, 175, 55, 0.85)',
  favorable: 'rgba(134, 239, 172, 0.8)',
  fated: 'rgba(134, 239, 172, 1)',
};

const FACTOR_POLARITY_COLORS: Record<string, string> = {
  for: 'rgba(134, 239, 172, 0.75)',
  against: 'rgba(248, 113, 113, 0.7)',
  neutral: TEXT_WARM,
};

// ── Card-row layout (THR-890) ──────────────────────────────────────
// The locked card format: picture band, keyword chip, title, cost, effect,
// quote. Sizes are constants so re-proportioning the row is a number change.

/** Card width. Four fit the encounter stage's column at 1920×1080 without wrap. */
const CARD_WIDTH_PX = 210;
/** Picture band height — "small generic image", not a hero illustration. */
const CARD_ART_HEIGHT_PX = 78;
/**
 * Tallest the hand may grow. The viewport contract forbids page scroll, so this
 * caps the row rather than letting a tall card push the commit button below the
 * fold; the row itself scrolls horizontally (see the row container).
 */
const HAND_MAX_HEIGHT_PX = 460;

export interface NudgePhaseShellProps {
  phase: EncounterStageNudgePhaseModel;
  /** Focal agent portrait, when the header resolved one. */
  portraitUrl?: string | null;
  agentName?: string;
  /** Commit the selected hand and let the step resolve. */
  onCommit: (nudgeIds: string[], essenceCost: number) => void;
  /** Open the motive explainer. Absent ⇒ the chip renders inert. */
  onOpenMotive?: (phase: EncounterStageNudgePhaseModel) => void;
}

// ── Card ───────────────────────────────────────────────────────────

function NudgeCard({
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

  return (
    <button
      type="button"
      data-testid={`nudge-card-${card.id}`}
      data-nudge-state={card.selected ? 'selected' : card.state}
      data-nudge-blocked={card.blockedCode ?? ''}
      data-nudge-keyword={card.keyword ?? ''}
      aria-pressed={card.selected}
      disabled={!card.interactive}
      onClick={onToggle}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 0,
        width: CARD_WIDTH_PX,
        // The row does not wrap, so a card must hold its width rather than
        // compressing into illegibility as the hand grows.
        flexShrink: 0,
        padding: 0,
        textAlign: 'left',
        borderRadius: 10,
        overflow: 'hidden',
        background: card.selected
          ? 'rgba(212, 175, 55, 0.12)'
          : 'rgba(255, 255, 255, 0.02)',
        border: `1px solid ${card.selected ? GOLD : 'rgba(212, 175, 55, 0.18)'}`,
        boxShadow: card.selected ? `0 0 12px rgba(212, 175, 55, 0.22)` : undefined,
        opacity: dimmed ? 0.45 : 1,
        cursor: card.interactive ? 'pointer' : 'not-allowed',
        transition: 'opacity 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {/* ── Picture band ──────────────────────────────────────────
          The fallback chain (THR-777/WS4, generated THR-832 batch 2). The
          manifest lookup runs on `imageTag`; an unresolved tag falls to the
          `nudge` category generic and, failing even that, returns null and ends
          at the EntityVisual gradient+glyph, which never blocks the render (plan
          fail-soft row). Art is the common path now that batch 2 has shipped,
          but the fallback branch stays load-bearing: it is what a 404 on a
          registered path degrades into, via the glyph `onError` swap. The card's
          keyword icon is the fallback glyph, so an artless card still shows the
          right *kind* of thing rather than a generic lozenge. */}
      <EntityVisual
        size="hero"
        shape="rounded"
        data-testid={`nudge-card-art-${card.id}`}
        descriptor={{
          tier: artPath ? 'art' : 'fallback',
          // `src` present ⇒ art tier; the glyph stays populated either way
          // because EntityVisual uses it as the <img> onError swap target.
          ...(artPath ? { src: artPath } : {}),
          glyph: card.keywordIcon ?? (card.sphere ? '◈' : '◇'),
          gradientIndex: gradientIndexForId(card.id),
          alt: card.name,
          kind: 'encounter',
        }}
        aria-label={card.name}
        style={{
          height: CARD_ART_HEIGHT_PX,
          aspectRatio: 'auto',
          borderRadius: 0,
          borderWidth: '0 0 1px 0',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px 12px', flex: 1 }}>
        {/* ── Keyword chip + cost ─────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          {card.keyword ? (
            <CardKeywordChip
              keyword={card.keyword}
              icon={card.keywordIcon}
              muted={dimmed}
              data-testid={`nudge-card-keyword-${card.id}`}
            />
          ) : (
            // A one-off authored option is not in the library and prints no
            // keyword. The slot still holds its ground so the cost stays right-
            // aligned across the row.
            <span />
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            {card.sphere && <SphereIcon sphere={card.sphere} size={13} />}
            <CostPips
              cost={card.essenceCost}
              emphasised={dimmed && card.blockedCode === 'essence_unavailable'}
              data-testid={`nudge-card-cost-${card.id}`}
            />
          </span>
        </div>

        {/* ── Title ───────────────────────────────────────────── */}
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 'var(--text-sm)',
            lineHeight: 1.25,
            color: card.selected ? GOLD : 'rgba(212, 196, 158, 0.95)',
          }}
        >
          {card.name}
        </span>

        {/* ── Alternate costs — a card paid for outside the pool says so ── */}
        {card.costChannels && card.costChannels.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {card.costChannels.map((channel) => (
              <span
                key={channel.id}
                data-testid={`nudge-card-channel-${card.id}-${channel.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-xs)', color: TEXT_WARM }}
              >
                <span aria-hidden="true">{channel.icon}</span>
                {channel.label}
                {/* Only a worsening delta earns penalty pips; relief is stated
                    in the label alone rather than drawn as a price. */}
                {channel.delta > 0 && <OddsPips value={-channel.delta} size={10} muted={dimmed} />}
              </span>
            ))}
          </div>
        )}

        {/* ── Effect + its odds, in the one pip vocabulary ─────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 'var(--text-xs)', lineHeight: 1.5, color: TEXT_WHISPER }}>
            {card.effectLine}
          </span>
          <OddsPips
            value={card.forecastDelta}
            muted={dimmed}
            data-testid={`nudge-card-odds-${card.id}`}
          />
        </div>

        {/* ── Flavor quote — the card's only prose ─────────────── */}
        {/* `marginTop: auto` seats the quote at the card's foot, so cards of
            different body lengths still line their quotes up across the row. */}
        <p
          style={{
            margin: 0,
            marginTop: 'auto',
            paddingTop: 2,
            fontFamily: FONT_PROSE,
            fontStyle: 'italic',
            fontSize: 'var(--text-xs)',
            lineHeight: 1.55,
            color: TEXT_WARM,
          }}
        >
          {card.fiction}
        </p>

        {/* A dimmed card always says why. This is the whole reason
            `essence_unavailable` dims instead of hiding. */}
        {dimmed && card.blockedReason && (
          <span
            data-testid={`nudge-card-reason-${card.id}`}
            style={{ fontSize: 'var(--text-xs)', color: 'rgba(248, 113, 113, 0.7)' }}
          >
            {card.blockedReason}
          </span>
        )}

        {designerView && (
          <span style={{ fontSize: 'var(--text-xs)', color: TEXT_WHISPER, fontFamily: 'monospace' }}>
            Δ{card.forecastDelta.toFixed(3)}
            {card.discounted ? ' · discounted' : ''}
            {card.riderLabel ? ` · ${card.riderLabel}` : ''}
          </span>
        )}
      </div>
    </button>
  );
}

// ── Shell ──────────────────────────────────────────────────────────

export function NudgePhaseShell({
  phase,
  portraitUrl,
  agentName,
  onCommit,
  onOpenMotive,
}: NudgePhaseShellProps) {
  const designerView = useSyncExternalStore(
    subscribeNudgeDesignerView,
    isNudgeDesignerViewEnabled,
    // Server snapshot — the stage never renders server-side, but the third
    // argument keeps `useSyncExternalStore` from warning under test renderers.
    isNudgeDesignerViewEnabled,
  );

  const hand = useNudgeHand(phase);
  const { testPanel, motive } = phase;

  return (
    <div data-testid="nudge-phase-shell" style={{ marginTop: 24 }}>
      {/* ── Motive strip ───────────────────────────────────────── */}
      {motive && (
        <div
          data-testid="nudge-motive-strip"
          style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}
        >
          <button
            type="button"
            data-testid="nudge-motive-chip"
            onClick={onOpenMotive ? () => onOpenMotive(phase) : undefined}
            disabled={!onOpenMotive}
            style={{
              padding: '3px 10px',
              borderRadius: 999,
              border: `1px solid ${GOLD}`,
              background: 'rgba(212, 175, 55, 0.08)',
              color: GOLD,
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.12em',
              cursor: onOpenMotive ? 'pointer' : 'default',
            }}
          >
            {motive.chipLabel}
          </button>
          <span style={{ fontFamily: FONT_PROSE, fontStyle: 'italic', fontSize: 'var(--text-sm)', color: TEXT_WARM }}>
            {motive.sentence}
          </span>
        </div>
      )}

      {/* ── Test panel ─────────────────────────────────────────── */}
      <div
        data-testid="nudge-test-panel"
        style={{
          display: 'flex',
          gap: 18,
          padding: '14px 16px',
          borderRadius: 10,
          border: '1px solid rgba(212, 175, 55, 0.15)',
          background: 'rgba(255, 255, 255, 0.015)',
        }}
      >
        <EntityVisual
          size="portrait"
          descriptor={{
            tier: portraitUrl ? 'art' : 'fallback',
            src: portraitUrl ?? undefined,
            glyph: '☖',
            gradientIndex: gradientIndexForId(phase.actionId),
            alt: agentName ?? 'The mortal',
            kind: 'agent',
          }}
          aria-label={agentName ?? 'The mortal'}
          style={{ width: 64, flexShrink: 0 }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            {testPanel.reachIconUrl && (
              <img
                src={testPanel.reachIconUrl}
                alt=""
                width={28}
                height={28}
                style={{ borderRadius: 4 }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 'var(--text-sm)', color: 'rgba(212, 196, 158, 0.95)' }}>
              {testPanel.reachLabel}
            </span>
            {testPanel.purposeLine && (
              <span style={{ fontSize: 'var(--text-xs)', color: TEXT_WHISPER }}>
                {testPanel.purposeLine}
              </span>
            )}
            <span
              data-testid="nudge-difficulty-word"
              style={{ fontSize: 'var(--text-xs)', color: TEXT_WARM, letterSpacing: '0.08em', textTransform: 'uppercase' }}
            >
              {testPanel.difficultyWord}
            </span>
            {designerView && (
              <span style={{ fontSize: 'var(--text-xs)', color: TEXT_WHISPER, fontFamily: 'monospace' }}>
                d={testPanel.difficultyValue.toFixed(2)}
              </span>
            )}
          </div>

          {testPanel.factors.length > 0 && (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {testPanel.factors.map((factor) => (
                <li
                  key={factor.id}
                  data-testid={`nudge-factor-${factor.id}`}
                  style={{
                    fontFamily: FONT_PROSE,
                    fontSize: 'var(--text-xs)',
                    color: FACTOR_POLARITY_COLORS[factor.polarity] ?? TEXT_WARM,
                  }}
                >
                  {factor.text}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Forecast — the tier word is the only probability surface. */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 'var(--text-xs)', color: TEXT_WHISPER, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Forecast
          </div>
          <div
            data-testid="nudge-forecast-word"
            data-forecast-tier={hand.forecast.tier}
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 'var(--text-lg)',
              color: FORECAST_TIER_COLORS[hand.forecast.tier] ?? GOLD,
              transition: 'color 0.3s ease',
            }}
          >
            {hand.forecast.word}
          </div>
          {/* THR-890 — the forecast joins the card row's odds language, so the
              player reads one vocabulary across the whole surface instead of
              comparing a word against a pip row. */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 3 }}>
            <OddsPips
              value={hand.forecast.probability}
              size={13}
              data-testid="nudge-forecast-pips"
            />
          </div>
          {hand.forecastMoved && (
            <div data-testid="nudge-forecast-moved" style={{ fontSize: 'var(--text-xs)', color: TEXT_WHISPER, fontStyle: 'italic' }}>
              was {hand.baseForecast.word}
            </div>
          )}
          {designerView && (
            <div style={{ fontSize: 'var(--text-xs)', color: TEXT_WHISPER, fontFamily: 'monospace' }}>
              p={hand.forecast.probability.toFixed(3)}
            </div>
          )}
        </div>
      </div>

      {/* ── The hand ───────────────────────────────────────────── */}
      <div style={{ marginTop: 22 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 'var(--text-sm)', color: TEXT_WARM, letterSpacing: '0.08em' }}>
            {NUDGE_HAND_HEADING}
          </span>
          {/* Rounded down: promising essence the player cannot actually spend
              is worse than under-reporting a fraction of it. */}
          <span data-testid="nudge-remaining-essence" style={{ fontSize: 'var(--text-xs)', color: TEXT_WHISPER }}>
            {Math.floor(hand.remainingEssence)} essence left
          </span>
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
            border: '1px dashed rgba(212, 175, 55, 0.25)',
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
          data-testid="nudge-commit"
          onClick={() => onCommit(hand.selectedIds, hand.selectedCost)}
          style={{
            padding: '10px 22px',
            borderRadius: 8,
            border: `1px solid ${GOLD}`,
            background: 'rgba(212, 175, 55, 0.1)',
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
