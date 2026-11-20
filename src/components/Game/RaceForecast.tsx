/**
 * THR-2252 — the race on the Mandate and Doom dialogs: the forecast sentence (which clock
 * lands first at this pace) and the one move that would change it most.
 *
 * Words come from `src/data/race-content.ts` through `selectRaceView` / `selectRaceLever`
 * (`engine/views/subjects/godSheet.ts`). Never a numeral (Law 13); the paces stay in
 * `window.__DEBUG.getRace()`.
 */
import type { RaceLeverView, RaceView } from '../../engine/views/subjects/godSheet';
import { RACE_TOOLTIP_ID } from '../../data/race-content';
import { Tooltip } from '../shared/Tooltip';
import { EntityLink } from '../shared/EntityLink';
import { Button } from '../shared/Button';

const LINE_STYLE = {
  fontSize: 'var(--text-xs)',
  lineHeight: 1.6,
  margin: 0,
} as const;

/** The forecast sentence, with the `ui.race` hover (Law 17). */
export function RaceForecastLine({ race }: { race: RaceView }) {
  return (
    <p data-testid="race-forecast" data-race-state={race.state} style={{ ...LINE_STYLE, color: 'var(--text-primary)' }}>
      <Tooltip id={RACE_TOOLTIP_ID}>{race.sentence}</Tooltip>
    </p>
  );
}

/**
 * The lever line. A chapter names the sphere (its `sphere.*` hover) and the mortal (an
 * `EntityLink` to their card, Law 21). Stay reuses THR-2240's "Stay it" button and
 * handler; once held it is THR-2240's held line with no button.
 */
export function RaceLeverLine({ lever, onStay, color }: { lever: RaceLeverView; onStay?: () => void; color?: string }) {
  if (lever.kind === 'chapter') {
    return (
      <p data-testid="race-lever" data-lever-kind="chapter" style={{ ...LINE_STYLE, color: 'var(--text-secondary)' }}>
        {lever.runs.map((run, i) => {
          if (run.slot === 'sphere') {
            return <Tooltip key={i} id={`sphere.${lever.sphere}`}>{run.text}</Tooltip>;
          }
          if (run.slot === 'mortal') {
            return <EntityLink key={i} id={lever.mortalId} name={run.text} entityRef={{ kind: 'agent', id: lever.mortalId }} />;
          }
          return <span key={i}>{run.text}</span>;
        })}
      </p>
    );
  }
  return (
    <div
      data-testid="race-lever"
      data-lever-kind="stay"
      data-lever-held={lever.button ? 'false' : 'true'}
      style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}
    >
      <span style={{ ...LINE_STYLE, color: 'var(--text-secondary)', flex: '1 1 12rem' }}>{lever.line}</span>
      {lever.button && onStay && (
        <Button
          variant="secondary"
          size="sm"
          data-testid="race-lever-stay-button"
          onClick={onStay}
          style={{ ...(color ? { borderColor: `${color}60` } : {}), flexShrink: 0 }}
        >
          {lever.button}
        </Button>
      )}
    </div>
  );
}
