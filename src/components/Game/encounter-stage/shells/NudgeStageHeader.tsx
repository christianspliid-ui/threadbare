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
import { DifficultyScales, ForecastDie, ReachIcon } from '../../../icons';
import { OddsPips } from '../../../shared/OddsPips';
import { FORECAST_TIER_COLORS } from '../../../shared/CardFace';
import {
  DIFFICULTY_BAND_COLOR_FALLBACK,
  DIFFICULTY_BAND_COLORS,
  NUDGE_READING_LEGEND_ENTRIES,
  NUDGE_READING_LEGEND_STORE_KEY,
  TEST_UNIT_LABEL,
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

/**
 * Difficulty and forecast marks. Line art at 30 sits level with the reach's
 * filled tile at 34 rather than under it.
 */
const MARK_PX = 30;

/** Legend glyphs, drawn at a size that reads as chrome rather than as a control. */
const LEGEND_MARK_PX = 14;

function difficultyColor(band: string): string {
  return DIFFICULTY_BAND_COLORS[band] ?? DIFFICULTY_BAND_COLOR_FALLBACK;
}

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
 * Reach, difficulty, forecast — the three marks, inline.
 *
 * Every one of them is glyph-only. Law 11 is what makes that legal: each carries
 * an `aria-label` stating its reading in words, and Law 12's legend (below) names
 * the vocabulary at first contact so none of it has to be inferred.
 */
export function NudgeReadingMarks({
  testPanel,
  forecast,
  baseForecast,
  forecastMoved,
  designerView,
}: NudgeReadingMarksProps) {
  const bandColor = difficultyColor(testPanel.difficultyWord);
  const tierColor = FORECAST_TIER_COLORS[forecast.tier] ?? GOLD_DIM;

  return (
    <>
      {/* ── Reach ────────────────────────────────────────────────
          THR-972 directive 2, unchanged: the shared icon set's `ReachIcon` draws
          the reach's own heraldic charge in its sphere colour, with the name as
          its accessible name and the `reach.*` tooltip chain behind it. Drawn
          once now — the veil's text reach chip stands down where these marks
          render, which is half of what the merge was for. */}
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

      {/* ── Difficulty ───────────────────────────────────────────
          The word is gone; the scales stay, and now tilt per band. The frame
          survives too — *"the difficulty cant stand alone"* was a director
          ruling about the reading, not about the word, and a lone mark floating
          in a row of chips is exactly what it was against. */}
      <Tooltip id="ui.nudge_difficulty">
        <span
          data-testid="nudge-test-unit"
          data-difficulty-band={testPanel.difficultyWord}
          role="img"
          aria-label={`${TEST_UNIT_LABEL}: ${testPanel.difficultyWord}`}
          title={`${TEST_UNIT_LABEL}: ${testPanel.difficultyWord}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 7px',
            borderRadius: 6,
            border: `1px solid ${bandColor}`,
            background: 'rgba(255, 255, 255, 0.02)',
            color: bandColor,
            flexShrink: 0,
            transition: 'color 0.3s ease, border-color 0.3s ease',
          }}
        >
          <DifficultyScales band={testPanel.difficultyWord} size={MARK_PX} />
        </span>
      </Tooltip>
      {designerView && (
        <span style={{ fontSize: 'var(--text-xs)', color: TEXT_WHISPER, fontFamily: 'monospace' }}>
          d={testPanel.difficultyValue.toFixed(2)}
        </span>
      )}

      {/* ── Forecast ─────────────────────────────────────────────
          *"remove the word forecast … make the forecast score 'uncertain' into
          an icon like a dice."* The die's pip count is the tier's rung on the
          `doomed … fated` ladder and its colour is that ladder's colour, so the
          reading survives both channels. The separate `OddsPips` row that used
          to sit under the word is gone with it: two magnitude readings of one
          number beside each other is the redundancy this ticket is about. The
          cards keep their pips, where fine resolution is what a player compares. */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          flexShrink: 0,
        }}
      >
        <Tooltip id="ui.nudge_forecast">
          <span
            data-testid="nudge-forecast-die"
            data-forecast-tier={forecast.tier}
            role="img"
            aria-label={`Fate's forecast: ${forecast.word}`}
            title={`Fate's forecast: ${forecast.word}`}
            style={{
              display: 'inline-flex',
              color: tierColor,
              transition: 'color 0.3s ease',
            }}
          >
            <ForecastDie tier={forecast.tier} size={MARK_PX} />
          </span>
        </Tooltip>
        {/* The "was …" read stays a word: it is a *comparison*, and a second die
            beside the first would read as two forecasts rather than as one that
            moved. Law 13's ban is on magnitudes, not on the tier vocabulary.

            **Beside the die, not beneath it.** Stacked, this line is wider than
            the die it belongs to, so the first nudge grew the header row's
            height and lifted the die out of alignment with the name and the
            location — the whole block visibly jumped on the click that was
            supposed to draw the eye to the die. Inline, the row keeps one
            height whether or not the forecast has moved. */}
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
            was {baseForecast.word}
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

// ── Balance ────────────────────────────────────────────────────────

export interface NudgeBalanceProps {
  testPanel: EncounterStageTestPanelModel;
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
export function NudgeBalance({ testPanel }: NudgeBalanceProps) {
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
              <span>{factor.text}</span>
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
                <LegendMark id={entry.id} testPanel={testPanel} />
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
function LegendMark({
  id,
  testPanel,
}: {
  id: 'difficulty' | 'forecast' | 'balance';
  testPanel: EncounterStageTestPanelModel;
}) {
  if (id === 'difficulty') {
    return (
      <span aria-hidden="true" style={{ color: difficultyColor(testPanel.difficultyWord) }}>
        <DifficultyScales band={testPanel.difficultyWord} size={LEGEND_MARK_PX} />
      </span>
    );
  }
  if (id === 'forecast') {
    return (
      <span aria-hidden="true" style={{ color: GOLD_DIM }}>
        <ForecastDie tier="uncertain" size={LEGEND_MARK_PX} />
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
