/**
 * NudgeMotiveIntro — THR-972 (director review 2026-08-02).
 *
 * The motive as the scene's **opening line**, printed above the encounter prose.
 *
 * Until this ticket the motive rendered as a chip + sentence pair at the top of
 * `NudgePhaseShell`, which sits *below* the veil's prose — so the answer to "why
 * is this mortal here" arrived after the player had already read the scene it was
 * meant to frame. The director's directive was to move it up and present it
 * differently; hence a bare introductory line rather than a labelled chip, in the
 * display face rather than the prose italic, so it reads as a lead-in to the
 * fiction rather than as another paragraph of it.
 *
 * **Why this is its own component.** The line renders in `EncounterVeil`, above
 * the prose block, while everything else about the nudge stage renders inside
 * `NudgePhaseShell`, below it. Those two mount points are in different subtrees,
 * so the line cannot live in the shell and still land above the prose. Keeping it
 * beside the shell keeps the whole nudge surface in one directory.
 *
 * The chip's explainer affordance survives: the line itself is the click target
 * when `onOpen` is supplied, and it keeps the `ui.nudge_motive` tooltip chain
 * (THR-926).
 *
 * Plan: `Docs/plans/2026-07-27-nudge-encounter-experience-ws1-ws2.md` § WS2
 */

import { Tooltip } from '../../../shared/Tooltip';
import type { EncounterStageNudgePhaseModel } from '../types';

// ── Design tokens (match the veil's palette) ───────────────────────
const FONT_DISPLAY = "'Palatino Linotype', 'Book Antiqua', Palatino, serif";
/**
 * Warmer and brighter than the prose beneath it. The line introduces the scene,
 * so it may lead the eye — but it is not a heading, which is why this stops well
 * short of the veil's full gold.
 */
const INTRO_COLOR = 'rgba(212, 196, 158, 0.9)';

/**
 * Matches the prose block's own `maxWidth`, so the introduction and the paragraph
 * it introduces share a measure instead of ragging against each other.
 */
const INTRO_MAX_WIDTH_PX = 540;

export interface NudgeMotiveIntroProps {
  phase: EncounterStageNudgePhaseModel;
  /** Open the motive explainer. Absent ⇒ the line renders as static text. */
  onOpen?: (phase: EncounterStageNudgePhaseModel) => void;
}

/**
 * Renders nothing when the phase carries no motive, or a motive with no intro
 * line — the meeting beats build a phase deliberately without one, and an absent
 * line must cost no vertical space rather than reserving an empty row.
 */
export function NudgeMotiveIntro({ phase, onOpen }: NudgeMotiveIntroProps) {
  const line = phase.motive?.introLine;
  if (!line) return null;

  const style: React.CSSProperties = {
    display: 'block',
    margin: 0,
    marginBottom: 14,
    maxWidth: INTRO_MAX_WIDTH_PX,
    padding: 0,
    background: 'none',
    border: 'none',
    textAlign: 'left',
    fontFamily: FONT_DISPLAY,
    fontSize: 'var(--text-sm)',
    lineHeight: 1.5,
    letterSpacing: '0.02em',
    color: INTRO_COLOR,
    cursor: onOpen ? 'pointer' : 'default',
  };

  return (
    <Tooltip id="ui.nudge_motive">
      {onOpen ? (
        <button
          type="button"
          data-testid="nudge-motive-intro"
          data-motive-source={phase.motive?.source}
          onClick={() => onOpen(phase)}
          style={style}
        >
          {line}
        </button>
      ) : (
        <p
          data-testid="nudge-motive-intro"
          data-motive-source={phase.motive?.source}
          style={style}
        >
          {line}
        </p>
      )}
    </Tooltip>
  );
}
