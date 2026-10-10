/**
 * NudgeStageHeader — THR-1478.
 *
 * The nudge stage's reading, split into the two pieces a host needs to place it:
 * {@link NudgeReadingMarks}, which sits inline in a header row, and
 * {@link NudgeBalance}, which hangs beneath it.
 *
 * **Why it is split.** Director find, 2026-09-12: *"we have redundancy in the
 * interface. please merge these two into one. i think the right placing is above
 * the prose."* The veil's context strip and this stage's test panel were drawing
 * the same portrait and the same reach on opposite sides of the prose. The merge
 * puts one block above the prose — but the portrait, name and location belong to
 * `EncounterVeil`'s `ContextStrip`, not to the nudge stage, so the stage
 * contributes *marks* into that row rather than owning a header of its own.
 *
 * `NudgePhaseShell` renders both pieces itself on the standalone path (the
 * meeting beats, which mount the shell with no context strip above them), so
 * there is one implementation of the reading and two placements of it.
 *
 * **What left the surface.** The objective line (`purposeLine`) — *"remove the
 * objective (hear them out). it is noise."* It survives in the designer view.
 * The `Forecast` label and the difficulty word went the same way, into the marks'
 * accessible names, their tooltips, and the first-contact legend (Laws 11, 12).
 */

import { useCallback, useState } from 'react';
import { Tooltip } from '../../../shared/Tooltip';
import { ReachIcon } from '../../../icons';
import { ReachStanding } from '../../../shared/ReachStanding';
import { OddsPips } from '../../../shared/OddsPips';
import { FORECAST_TIER_COLORS } from '../../../shared/CardFace';
import {
  NUDGE_READING_LEGEND_ENTRIES,
  NUDGE_READING_LEGEND_STORE_KEY,
  NUDGE_FORECAST_SHIFT_LINES,
  NUDGE_LEGEND_FORECAST_SAMPLE_WORD,
  FORECAST_TIER_LADDER,
  NUDGE_FACTOR_KIND_TAGS,
} from '../../../../data/nudge-stage-content';
import type {
  EncounterStageForecastModel,
  EncounterStageTestPanelModel,
} from '../types';

// ── Tokens (the veil's ceremonial palette — Law 30) ────────────────
const TEXT_WARM = 'var(--veil-text-warm)';
const TEXT_WHISPER = 'var(--veil-text-whisper)';
const FONT_PROSE = 'var(--font-prose)';
const GOLD_DIM = 'rgb(var(--veil-gold-rgb) / 0.4)';

/**
 * Factor-sentence polarity (moved here with the lines themselves).
 *
 * These colour whole sentences, so Law 45 binds both. `against` takes the
 * measured loss-text floor — at 0.7, chosen to sit near the green's 0.75, it
 * painted 3.95:1 against `--veil-void`.
 */
const FACTOR_POLARITY_COLORS: Record<string, string> = {
  for: 'rgb(var(--veil-gain-rgb) / 0.75)',
  against: 'rgb(var(--veil-loss-rgb) / var(--veil-loss-text-alpha))',
  neutral: TEXT_WARM,
};

/** Factor-line pip row (THR-970) — one notch below the card row's default. */
const FACTOR_PIP_SIZE = 10;
const FACTOR_PIP_GAP = 6;

/**
 * Reach chip edge (THR-972). An icon carrying meaning *alone*, with no text
 * label beside it, sizes up — Law 11 cites this value.
 */
export const REACH_ICON_PX = 34;

const FONT_DISPLAY = "'Palatino Linotype', 'Book Antiqua', Palatino, serif";

/** Forecast tier → its `--forecast-*-rgb` channel token (THR-1724). */
const FORECAST_PILL_CHANNELS: Record<string, string> = {
  doomed: '--forecast-doomed-rgb',
  perilous: '--forecast-perilous-rgb',
  uncertain: '--forecast-uncertain-rgb',
  favorable: '--forecast-favorable-rgb',
  fated: '--forecast-fated-rgb',
};

/** The pill's edge and wash — quieter than its word, which carries the reading. */
const FORECAST_PILL_EDGE_ALPHA = 0.55;
const FORECAST_PILL_WASH_ALPHA = 0.12;

// ── Marks ──────────────────────────────────────────────────────────

export interface NudgeReadingMarksProps {
  testPanel: EncounterStageTestPanelModel;
  /** Forecast with the current selection applied — moves as cards toggle. */
  forecast: EncounterStageForecastModel;
  /** Forecast with nothing selected, for the "was …" read. */
  baseForecast: EncounterStageForecastModel;
  forecastMoved: boolean;
  designerView: boolean;
}

/**
 * Reach, the mortal's standing in it, the forecast — the title row's marks.
 *
 * THR-1724 (Christian, 2026-10-04): the encounter's title row is its metadata
 * row — title · reach icon · the sheet's reach readout · forecast pill.
 *
 * - **No difficulty mark.** The forecast already weighs difficulty against the
 *   mortal; a separate scale beside it was a second reading of half the same
 *   number. The raw difficulty stays in the designer view and the traces.
 * - **The skill moved here.** "{actor} is {word} in {reach}." was a factor line;
 *   it is now the character sheet's own readout (`ReachStanding`), with that
 *   sentence as its tooltip, so the actor is still named (Law 1).
 * - **The forecast is a word in a coloured pill** on the quest-difficulty ladder
 *   (`--forecast-*-rgb`). The word always shows (Law 31): the hue repeats it.
 */
export function NudgeReadingMarks({
  testPanel,
  forecast,
  baseForecast,
  forecastMoved,
  designerView,
}: NudgeReadingMarksProps) {
  return (
    <>
      {/* ── Reach ────────────────────────────────────────────────
          THR-972 directive 2, unchanged: the shared icon set's `ReachIcon` in
          its sphere colour, the name as its accessible name, the `reach.*`
          tooltip behind it. */}
      <Tooltip id={`reach.${testPanel.reach}`}>
        <span
          data-testid="nudge-reach-chip"
          data-reach={testPanel.reach}
          role="img"
          aria-label={testPanel.reachLabel}
          title={testPanel.reachLabel}
          style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
        >
          <ReachIcon reach={testPanel.reach} size={REACH_ICON_PX} />
        </span>
      </Tooltip>

      {/* ── The mortal's standing in the reach (THR-1724) ──────── */}
      {testPanel.skill && (
        <Tooltip label={testPanel.skill.sentence}>
          <span
            data-testid="nudge-skill-chip"
            aria-label={testPanel.skill.sentence}
            style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, cursor: 'help' }}
          >
            <ReachStanding
              reach={testPanel.reach}
              tier={testPanel.skill.tier}
              layout="inline"
              nameTooltip={false}
              nameColor="var(--veil-gold-text)"
              wordColor={TEXT_WARM}
            />
          </span>
        </Tooltip>
      )}
      {designerView && (
        <span style={{ fontSize: 'var(--text-xs)', color: TEXT_WHISPER, fontFamily: 'monospace' }}>
          d={testPanel.difficultyValue.toFixed(2)} ({testPanel.difficultyWord})
        </span>
      )}

      {/* ── Forecast ─────────────────────────────────────────────
          The word in its ladder colour, recolouring live as the hand moves it.
          The "your hand lifts/lowers the odds" note sits beside the pill, not beneath it, so the
          row keeps one height whether or not the forecast has moved. THR-1714:
          it names its cause in the present tense — "was Perilous" read as the
          roll having already happened. THR-1791: it names the direction, never
          a tier — the pill is the one odds word on the row. */}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
        {/* THR-1713 D5 — the pill's hover explains *its* word, then chains the
            ladder; it changes as the hand moves the tier. */}
        <Tooltip id={`ui.forecast.${forecast.tier}`}>
          <ForecastPill tier={forecast.tier} word={forecast.word} />
        </Tooltip>
        {forecastMoved && (
          <span
            data-testid="nudge-forecast-moved"
            style={{
              fontFamily: FONT_PROSE,
              fontSize: 'var(--text-2xs)',
              color: TEXT_WHISPER,
              fontStyle: 'italic',
              whiteSpace: 'nowrap',
            }}
          >
            {NUDGE_FORECAST_SHIFT_LINES[forecastShiftDirection(baseForecast.tier, forecast.tier)]}
          </span>
        )}
      </span>
      {designerView && (
        <span style={{ fontSize: 'var(--text-xs)', color: TEXT_WHISPER, fontFamily: 'monospace' }}>
          p={forecast.probability.toFixed(3)}
          {testPanel.purposeLine ? ` · ${testPanel.purposeLine}` : ''}
        </span>
      )}
    </>
  );
}

/**
 * THR-1791 — which way the hand moved the odds, read on the forecast ladder.
 * Only called when the tier moved; an unknown tier ranks as `uncertain`
 * (fail-soft), so a malformed pair reads as a lift rather than throwing.
 */
export function forecastShiftDirection(fromTier: string, toTier: string): 'up' | 'down' {
  const rank = (tier: string) => {
    const i = FORECAST_TIER_LADDER.indexOf(tier as (typeof FORECAST_TIER_LADDER)[number]);
    return i < 0 ? FORECAST_TIER_LADDER.indexOf('uncertain') : i;
  };
  return rank(toTier) < rank(fromTier) ? 'down' : 'up';
}

/**
 * THR-1724 — the forecast word in a pill on the quest-difficulty ladder.
 *
 * Word ink is the tier's full colour (the Law 45 measurement); the edge and the
 * wash are the same hue at the pill's quieter alphas. Exported for the legend,
 * which draws the same mark at legend scale.
 */
export function ForecastPill({
  tier,
  word,
  compact = false,
}: {
  tier: string;
  word: string;
  compact?: boolean;
}) {
  const ink = FORECAST_TIER_COLORS[tier] ?? GOLD_DIM;
  const channel = FORECAST_PILL_CHANNELS[tier];
  return (
    <span
      data-testid={compact ? undefined : 'nudge-forecast-pill'}
      data-forecast-tier={tier}
      role="img"
      aria-label={`Fate's forecast: ${word}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: compact ? '0 6px' : '3px 12px',
        borderRadius: 999,
        border: `1px solid ${channel ? `rgb(var(${channel}) / ${FORECAST_PILL_EDGE_ALPHA})` : GOLD_DIM}`,
        background: channel ? `rgb(var(${channel}) / ${FORECAST_PILL_WASH_ALPHA})` : 'transparent',
        color: ink,
        fontFamily: FONT_DISPLAY,
        fontSize: compact ? 'var(--text-2xs)' : 'var(--text-xs)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        transition: 'color 0.3s ease, border-color 0.3s ease, background 0.3s ease',
      }}
    >
      {word}
    </span>
  );
}

// ── Balance ────────────────────────────────────────────────────────

/**
 * THR-1670 — a factor sentence, with its linked name (if any) as a button that
 * opens the entity's page (Law 4). A link whose text is not in the sentence, or a
 * host with no opener, renders the plain sentence.
 */
function FactorLineText({
  factor,
  onOpenEntity,
}: {
  factor: EncounterStageTestPanelModel['factors'][number];
  onOpenEntity?: (entityId: string, kind: 'attachment') => void;
}) {
  const link = factor.link;
  const at = link ? factor.text.indexOf(link.text) : -1;
  if (!link || at < 0 || !onOpenEntity) return <span>{factor.text}</span>;
  return (
    <span>
      {factor.text.slice(0, at)}
      <button
        type="button"
        className="focus-ring"
        data-testid={`nudge-factor-link-${factor.id}`}
        onClick={() => onOpenEntity(link.entityId, link.kind)}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          font: 'inherit',
          color: 'inherit',
          fontStyle: 'italic',
          textDecoration: 'underline',
          textUnderlineOffset: 3,
          cursor: 'pointer',
        }}
      >
        {link.text}
      </button>
      {factor.text.slice(at + link.text.length)}
    </span>
  );
}

export interface NudgeBalanceProps {
  testPanel: EncounterStageTestPanelModel;
  /**
   * THR-1670 — opens a named entity a factor line links (the step cast's spell).
   * Absent: the name stays plain text (fail-open, never a dead link).
   */
  onOpenEntity?: (entityId: string, kind: 'attachment') => void;
}

/**
 * The factor sentences, and the legend that names how to read them.
 *
 * **The Balance disposition (THR-1478 item 5).** The per-sentence
 * `ui.nudge_factors` hover is gone. Every line already states its own reading in
 * its colour — green for, red against, unmarked context — so the hover was a
 * rulebook entry attached to content that did not need one, and it fired on
 * every line. The colour vocabulary it was teaching moved to the first-contact
 * legend (Law 12), where a vocabulary belongs; the registry entry itself lives
 * on as that legend item's tooltip, so nothing was deleted from the one tooltip
 * registry (Law 17).
 */
export function NudgeBalance({ testPanel, onOpenEntity }: NudgeBalanceProps) {
  // Law 51 — dismissed once, not once per encounter. Fail-soft (NFP #4):
  // private browsing throws on `localStorage`, and the designed failure is to
  // *show* the legend, because Law 12 prefers noisy over missing.
  const [legendDismissed, setLegendDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(NUDGE_READING_LEGEND_STORE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const dismissLegend = useCallback(() => {
    setLegendDismissed(true);
    try {
      localStorage.setItem(NUDGE_READING_LEGEND_STORE_KEY, 'true');
    } catch {
      // Quota or private browsing — the dismissal still holds for this session.
    }
  }, []);

  if (testPanel.factors.length === 0 && legendDismissed) return null;

  return (
    <div data-testid="nudge-balance" style={{ marginTop: 8 }}>
      {testPanel.factors.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {testPanel.factors.map((factor) => (
            <li
              key={factor.id}
              data-testid={`nudge-factor-${factor.id}`}
              data-factor-polarity={factor.polarity}
              style={{
                fontFamily: FONT_PROSE,
                fontSize: 'var(--text-xs)',
                color: FACTOR_POLARITY_COLORS[factor.polarity] ?? TEXT_WARM,
                display: 'flex',
                alignItems: 'center',
                gap: FACTOR_PIP_GAP,
              }}
            >
              {/* THR-1713 D6 — Law 31: the polarity is a word as well as a
                  colour. Only the tag hovers; the per-line rulebook hover that
                  THR-1478 removed stays removed. Neutral lines carry no tag. */}
              {(factor.polarity === 'for' || factor.polarity === 'against') && (
                <Tooltip id={`ui.nudge_factor.${factor.polarity}`}>
                  <span
                    data-testid={`nudge-factor-kind-${factor.id}`}
                    data-factor-kind={factor.polarity}
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--text-2xs)',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      cursor: 'help',
                    }}
                  >
                    {NUDGE_FACTOR_KIND_TAGS[factor.polarity]}
                  </span>
                </Tooltip>
              )}
              <FactorLineText factor={factor} onOpenEntity={onOpenEntity} />
              {/* THR-970 — the magnitude beside the sentence, in the same pip
                  vocabulary the cards use. Polarity stays on the text colour;
                  the pips carry size. An absent delta draws nothing at all (the
                  model's documented contract) rather than an empty row promising
                  a magnitude the line does not have — and OddsPips independently
                  returns null below the vocabulary's epsilon, so a sub-threshold
                  delta is silent too. */}
              {factor.delta !== undefined && (
                <OddsPips
                  value={factor.delta}
                  size={FACTOR_PIP_SIZE}
                  data-testid={`nudge-factor-pips-${factor.id}`}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {/* ── First-contact legend (Law 12) ───────────────────────
          Three marks arrived on this row at once and none of them spells itself
          out. `CONSEQUENCE_LEGEND_ENTRIES` on the aftermath is the pattern this
          follows: glyph beside noun, each hovering into the same tooltip the
          mark itself uses, dismissed once and remembered (Law 51). */}
      {!legendDismissed && (
        <div
          data-testid="nudge-reading-legend"
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginTop: 10,
            fontSize: 'var(--text-2xs)',
            letterSpacing: '0.1em',
            color: TEXT_WHISPER,
          }}
        >
          {NUDGE_READING_LEGEND_ENTRIES.map((entry) => (
            <Tooltip key={entry.id} id={entry.tooltipId}>
              <span
                className="focus-ring"
                tabIndex={0}
                data-testid={`nudge-reading-legend-${entry.id}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <LegendMark id={entry.id} />
                {entry.label}
              </span>
            </Tooltip>
          ))}
          <button
            className="focus-ring"
            type="button"
            data-testid="nudge-reading-legend-dismiss"
            onClick={dismissLegend}
            style={{
              background: 'none',
              border: 'none',
              // Law 46 — the mark stays small, the hit area does not.
              padding: '6px 8px',
              margin: '-6px -8px',
              font: 'inherit',
              color: TEXT_WHISPER,
              borderBottom: `1px solid ${GOLD_DIM}`,
              cursor: 'pointer',
            }}
          >
            got it
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * The legend draws the *same* marks the row does, at legend scale — a key whose
 * symbols differ from the surface's is worse than no key at all. `balance` has
 * no single glyph, so it shows the polarity colours it is naming.
 */
function LegendMark({ id }: { id: 'forecast' | 'balance' }) {
  if (id === 'forecast') {
    return (
      <span aria-hidden="true">
        <ForecastPill tier="uncertain" word={NUDGE_LEGEND_FORECAST_SAMPLE_WORD} compact />
      </span>
    );
  }
  return (
    <span aria-hidden="true" style={{ display: 'inline-flex', gap: 2 }}>
      {(['for', 'against', 'neutral'] as const).map((polarity) => (
        <span
          key={polarity}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: FACTOR_POLARITY_COLORS[polarity],
          }}
        />
      ))}
    </span>
  );
}
