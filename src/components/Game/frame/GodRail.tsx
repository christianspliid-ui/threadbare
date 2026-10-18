/**
 * GodRail — the left rail of the game screen: the Ascendant Bar mount
 * (THR-184), moved verbatim out of GameView (THR-1881 split step e).
 *
 * Moves only: the props are GameView's own values under GameView's own names.
 * The Mandate opener comes from `GameScreenState`, which DialogHost reads to
 * render the Mandate detail.
 *
 * THR-1894 (frame plan § F6, § F12): the rail is drawn from `GOD_RAIL_SECTIONS`, and
 * this host owns the hand's press seam. With no `HandPressContext` above it (before
 * THR-1876's arming, THR-1914), it mounts the default: a card press opens the card's
 * Codex entry. While a moment is open the hand rests (`handRest`).
 */
import { useMemo, type ComponentProps, type Dispatch, type SetStateAction } from 'react';
import type { GameState } from '../../../types/gameState';
import { AscendantBar } from '../ascendant-bar/AscendantBar';
import { useGameScreenState } from './GameScreenState';
import { HandPressProvider, useHandPressProvider, type HandPressValue } from './HandPressContext';
import type { HandRest } from './HandSection';

type AscendantBarProps = ComponentProps<typeof AscendantBar>;

export interface GodRailProps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  archetype: AscendantBarProps['archetype'];
  ascendantIdentity: AscendantBarProps['ascendantIdentity'];
  avatarName: AscendantBarProps['avatarName'];
  worldVersion: AscendantBarProps['worldVersion'];
  setAscendantSheetOpen: Dispatch<SetStateAction<boolean>>;
  openCodex: NonNullable<AscendantBarProps['onOpenCodex']>;
  setAttachmentSheetId: NonNullable<AscendantBarProps['onOpenAttachment']>;
  showMandate: AscendantBarProps['showMandate'];
  opening: AscendantBarProps['opening'];
  handleCenterOnHex: NonNullable<AscendantBarProps['onCenterOnSeat']>;
  handleAvatarMoveClick: NonNullable<AscendantBarProps['onMove']>;
  handleScryWithMutex: NonNullable<AscendantBarProps['onInvestiture']>;
  /** Open one Codex entry; false when the Codex has no such entry (GameView's `openCodexSheet`). */
  openCodexEntry?: (entryId: string) => boolean | void;
  /** Why the hand rests, from the interrupt registry: an encounter, another moment, or nothing. */
  handRest?: HandRest;
}

export function GodRail({
  gameState,
  setGameState,
  archetype,
  ascendantIdentity,
  avatarName,
  worldVersion,
  setAscendantSheetOpen,
  openCodex,
  setAttachmentSheetId,
  showMandate,
  opening,
  handleCenterOnHex,
  handleAvatarMoveClick,
  handleScryWithMutex,
  openCodexEntry,
  handRest = null,
}: GodRailProps) {
  const { setMandateDetailOpen } = useGameScreenState();
  const outer = useHandPressProvider();
  // The default press: read the work (Law 25). An entry the Codex lacks opens the catalog.
  const defaultPress: HandPressValue = useMemo(() => ({
    press: (cardId: string) => {
      if (openCodexEntry?.(cardId) === false) openCodex();
    },
    armedActionId: null,
  }), [openCodexEntry, openCodex]);
  const rail = (
    <AscendantBar
      handRest={handRest}
      gameState={gameState}
      archetype={archetype}
      ascendantIdentity={ascendantIdentity}
      avatarName={avatarName}
      worldVersion={worldVersion}
      onOpenSheet={() => setAscendantSheetOpen(true)}
      onOpenMandate={() => setMandateDetailOpen(true)}
      onOpenCodex={openCodex}
      // THR-1330 — a Hooks chip's link half. Deliberately the same setter the
      // aftermath consequence chip uses (THR-1120), so the condition the player
      // was granted at the end of an encounter and the condition sitting on their
      // bar afterwards open the one sheet. A second attachment surface for the
      // same concept class is what Law 3 exists to prevent.
      onOpenAttachment={setAttachmentSheetId}
      showMandate={showMandate}
      opening={opening}
      onCenterOnSeat={handleCenterOnHex}
      onMove={handleAvatarMoveClick}
      onInvestiture={handleScryWithMutex}
      onReleaseControl={(effectId) =>
        // Queue a voluntary release; phaseControlEffects lapses it next tick (THR-613 §3.4).
        // The row leaves the panel immediately because selectCovenantRows hides queued ids.
        setGameState((prev) => ({
          ...prev,
          pendingControlReleases: [...(prev.pendingControlReleases ?? []), effectId],
        }))
      }
    />
  );
  return outer ? rail : <HandPressProvider value={defaultPress}>{rail}</HandPressProvider>;
}
