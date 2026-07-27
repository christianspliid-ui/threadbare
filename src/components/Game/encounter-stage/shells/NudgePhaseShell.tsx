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
import { gradientIndexForId } from '../../../../data/entity-visual-fallbacks';
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

  return (
    <button
      type="button"
      data-testid={`nudge-card-${card.id}`}
      data-nudge-state={card.selected ? 'selected' : card.state}
      data-nudge-blocked={card.blockedCode ?? ''}
      aria-pressed={card.selected}
      disabled={!card.interactive}
      onClick={onToggle}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 6,
        width: 200,
        padding: '12px 14px',
        textAlign: 'left',
        borderRadius: 8,
        background: card.selected
          ? 'rgba(212, 175, 55, 0.12)'
          : 'rgba(255, 255, 255, 0.02)',
        border: `1px solid ${card.selected ? GOLD : 'rgba(212, 175, 55, 0.18)'}`,
        opacity: dimmed ? 0.4 : 1,
        cursor: card.interactive ? 'pointer' : 'not-allowed',
        transition: 'opacity 0.2s ease, border-color 0.2s ease, background 0.2s ease',
      }}
    >
      {/* Art — the fallback chain. Specific art and the `imageTag` manifest
          lookup are WS4; until that lands the chain ends at the EntityVisual
          gradient+glyph, which never blocks the render (plan fail-soft row). */}
      <EntityVisual
        size="chip"
        shape="rounded"
        descriptor={{
          tier: 'fallback',
          glyph: card.sphere ? '◈' : '◇',
          gradientIndex: gradientIndexForId(card.id),
          alt: card.name,
          kind: 'encounter',
        }}
        aria-label={card.name}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
        {card.sphere && <SphereIcon sphere={card.sphere} size={14} />}
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 'var(--text-sm)',
            color: card.selected ? GOLD : 'rgba(212, 196, 158, 0.95)',
          }}
        >
          {card.name}
        </span>
      </div>

      <p
        style={{
          margin: 0,
          fontFamily: FONT_PROSE,
          fontStyle: 'italic',
          fontSize: 'var(--text-xs)',
          lineHeight: 1.6,
          color: TEXT_WARM,
        }}
      >
        {card.fiction}
      </p>

      <span style={{ fontSize: 'var(--text-xs)', color: TEXT_WHISPER }}>
        {card.effectLine}
      </span>

      <span style={{ fontSize: 'var(--text-xs)', color: GOLD, letterSpacing: '0.04em' }}>
        {card.costLabel}
      </span>

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
          {card.riderLabel ? ` · ${card.riderLabel}` : ''}
        </span>
      )}
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
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
        {hand.selectedCost > 0 && (
          <span data-testid="nudge-selected-cost" style={{ fontSize: 'var(--text-xs)', color: TEXT_WARM }}>
            {hand.selectedCost} essence
          </span>
        )}
      </div>
    </div>
  );
}
