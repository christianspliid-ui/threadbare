/**
 * ReachRungMarker — the rung a Reach tier word sits on, drawn beside the word (THR-1814).
 *
 * Round-3 cold testers still read "Blinkered" as a state, not as the first of five
 * rungs. A visible marker (●○○○○) makes the word read as a rank without a hover:
 * Law 13's visual-magnitude amendment (THR-1082), never a numeral. It is the same
 * `StepDots` magnitude row a mortal's `ReachStanding` draws (Law 27 — one primitive
 * for one idea), and its step count follows the register's own ladder
 * (`tierWords.length`), so it is not a literal.
 *
 * Decorative for assistive tech: the tier word's tooltip already names the rung
 * ("The first of five rungs…"), and the marker sits inside that same tooltip.
 */
import { getReachRung } from '../../../data/ascendant-reach-register';
import { StepDots } from '../../shared/StepDots';

/** Dot edge in px — small enough to sit on the tier word's baseline. */
const REACH_RUNG_DOT_PX = 5;

interface ReachRungMarkerProps {
  reach: string;
  tierWord: string;
  /** Test id for the marker (the bar and the sheet each carry their own). */
  testId?: string;
}

export function ReachRungMarker({ reach, tierWord, testId }: ReachRungMarkerProps) {
  const rung = getReachRung(reach, tierWord);
  if (!rung) return null;

  return (
    <span
      data-testid={testId}
      data-rung={rung.rung}
      data-rung-count={rung.count}
      aria-hidden="true"
      style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 6, verticalAlign: 'middle' }}
    >
      <StepDots
        variant="magnitude"
        totalSteps={rung.count}
        currentStepIndex={rung.rung}
        size={REACH_RUNG_DOT_PX}
      />
    </span>
  );
}
