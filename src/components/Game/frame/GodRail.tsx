/**
 * GodRail — the left rail of the game screen: the Ascendant Bar mount
 * (THR-184), moved verbatim out of GameView (THR-1881 split step e).
 *
 * Moves only: the props are GameView's own values under GameView's own names.
 * The Mandate opener comes from `GameScreenState`, which DialogHost reads to
 * render the Mandate detail.
 */
import type { ComponentProps, Dispatch, SetStateAction } from 'react';
import type { GameState } from '../../../types/gameState';
import { AscendantBar } from '../ascendant-bar/AscendantBar';
import { useGameScreenState } from './GameScreenState';

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
}: GodRailProps) {
  const { setMandateDetailOpen } = useGameScreenState();
  return (
    <AscendantBar
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
}
