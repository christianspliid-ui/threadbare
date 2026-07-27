/**
 * NudgeDesignerTab — THR-775 (WS2 interface).
 *
 * The designer view's home. The player stage shows words and withholds the
 * replayability pool; this tab is where *we* see the numbers behind those words
 * and the cards the stage refuses to show — dimmed and withheld alike, each
 * with its `NudgeBlockedCode`.
 *
 * It deliberately lives in the DebugPanel rather than in the stage: the plan
 * forbids growing a numbers toggle on the player surface. Flipping the switch
 * here re-renders any open nudge stage through the shared `designerView` store.
 */

import { useSyncExternalStore } from 'react';
import {
  isNudgeDesignerViewEnabled,
  setNudgeDesignerView,
  subscribeNudgeDesignerView,
} from '../encounter-stage/designerView';
import { EMPTY_STATE_STYLE } from './debugPanelStyles';

export function NudgeDesignerTab() {
  const enabled = useSyncExternalStore(
    subscribeNudgeDesignerView,
    isNudgeDesignerViewEnabled,
    isNudgeDesignerViewEnabled,
  );

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        data-testid="nudge-designer-toggle"
      >
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setNudgeDesignerView(e.target.checked)}
        />
        <span style={{ color: 'var(--text-primary)' }}>Designer view</span>
      </label>

      <p style={{ ...EMPTY_STATE_STYLE, margin: 0, textAlign: 'left' }}>
        {enabled
          ? 'On. The open encounter stage now shows the difficulty value, the forecast probability, each card’s forecast delta and rider, plus the cards withheld from the player (sphere_locked / unlock_missing / trait_missing).'
          : 'Off. The encounter stage shows the player surface only — words, no numerals, and no withheld cards.'}
      </p>

      <p style={{ ...EMPTY_STATE_STYLE, margin: 0, textAlign: 'left' }}>
        Also reachable headlessly as{' '}
        <code>window.__DEBUG.setNudgeDesignerView(true)</code>.
      </p>
    </div>
  );
}
