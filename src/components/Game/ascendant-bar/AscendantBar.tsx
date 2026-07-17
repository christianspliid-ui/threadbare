/**
 * AscendantBar — persistent left rail (360 px) for the hexmap screen.
 *
 * Shows ascendant self-state: identity + quintessence, reaches, essence, actions,
 * mandate, and hooks (conditions / clues / vows). Six foldable sections.
 *
 * Prose-first, no numbers, 1920×1080 viewport contract.
 * Supersedes: IdentityChip (top bar), AvatarHUD overlay, EssencePanel (right rail),
 * MandateTracker (right rail).
 *
 * THR-184: Ascendant Bar
 */
import React, { useMemo, useState } from 'react';
import type { GameState } from '../../../types/gameState';
import type { AscendantArchetype } from '../../../types/influence';
import type { AscendantIdentity } from '../../../types/remembrance';
import { BarSection } from './BarSection';
import { IdentityStrip } from './IdentityStrip';
import { EssenceBlock } from './EssenceBlock';
import { ReachesBlock } from './ReachesBlock';
import { SignaturesBlock } from './SignaturesBlock';
import { ActionsBlock } from './ActionsBlock';
import { CovenantsBlock } from './CovenantsBlock';
import { MandateBlock } from './MandateBlock';
import { HooksBlock } from './HooksBlock';
import {
  selectAscendantIdentityView,
  selectQuintessenceView,
  selectEssenceRows,
  selectActionTray,
  selectMandateRow,
  selectReachRows,
  selectSignaturePaths,
  selectCovenantRows,
} from './selectors';
import styles from './styles.module.css';

// ── Default section open/closed state (NFP #1: tunability) ──────────────────
const ASCENDANT_BAR_SECTION_DEFAULT_OPEN = {
  identity: true,
  // Open by default: the two permanent reaches are the player's identity anchor, and the
  // progression curve is unreadable if the depth readout is folded away (THR-613 §5.D).
  reaches: true,
  // Closed by default: the signature-path readout is supplementary legibility (which
  // headline powers are yours vs. another incarnation's), not always-critical, and eight
  // rows would push the always-open sections below the fold on the 360px rail.
  signatures: false,
  essence: true,
  actions: true,
  // Closed by default: covenants are supplementary (most turns hold zero or one), and an
  // open, potentially multi-row list would push the always-open sections below the fold.
  covenants: false,
  mandate: true,
  hooks: false,
} as const;

interface AscendantBarProps {
  gameState: GameState;
  archetype: AscendantArchetype;
  ascendantIdentity: AscendantIdentity | null;
  avatarName: string;
  worldVersion: number;
  onOpenSheet: () => void;
  onOpenMandate: () => void;
  onMove?: () => void;
  onInvestiture?: () => void;
  /** Queue a voluntary release of a sustained control (THR-613 §3.4). */
  onReleaseControl?: (effectId: string) => void;
}

export function AscendantBar({
  gameState,
  archetype,
  ascendantIdentity: _ascendantIdentity,
  avatarName,
  worldVersion,
  onOpenSheet,
  onOpenMandate,
  onMove,
  onInvestiture,
  onReleaseControl,
}: AscendantBarProps) {
  const [open, setOpen] = useState({ ...ASCENDANT_BAR_SECTION_DEFAULT_OPEN });
  const toggle = (key: keyof typeof open) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  // Memoize derived views on worldVersion
  const identity = useMemo(
    () => selectAscendantIdentityView(gameState, archetype, avatarName),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameState, archetype, avatarName, worldVersion],
  );
  const quintessence = useMemo(
    () => selectQuintessenceView(gameState),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameState, worldVersion],
  );
  const essenceRows = useMemo(
    () => selectEssenceRows(gameState, archetype),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameState, archetype, worldVersion],
  );
  const actionTray = useMemo(
    () => selectActionTray(gameState),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameState, worldVersion],
  );
  const mandateRow = useMemo(
    () => selectMandateRow(gameState),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameState, worldVersion],
  );
  const reachRows = useMemo(
    () => selectReachRows(gameState),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameState, worldVersion],
  );
  const signaturePaths = useMemo(
    () => selectSignaturePaths(gameState),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameState, worldVersion],
  );
  // Count = the god's own paths (available + acquirable); the not-this-incarnation
  // paths are context, not a tally of what the player holds.
  const yourSignatureCount = useMemo(
    () => signaturePaths.filter((p) => p.state !== 'locked_incarnation').length,
    [signaturePaths],
  );
  const covenantRows = useMemo(
    () => selectCovenantRows(gameState),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameState, worldVersion],
  );

  const actionCount = 2 + actionTray.self.length + actionTray.rare.length; // 2 = hardcoded core (Move + Investiture)
  const hookCount = useMemo(() => {
    const ascendantId = gameState.ascendantId;
    return gameState.graph.getOutgoingEdges(ascendantId, 'has_attachment').length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, worldVersion]);

  return (
    <aside className={styles.bar} aria-label="Ascendant status">
      {/* 1. Identity + Quintessence (merged) */}
      <IdentityStrip
        identity={identity}
        quintessence={quintessence}
        treatment="breathe"
        onOpen={onOpenSheet}
      />

      {/* 2. Reaches (two permanent domains + depth) */}
      <BarSection
        label="Reaches"
        count={reachRows.length}
        open={open.reaches}
        onToggle={() => toggle('reaches')}
        placeholder="Your domains are not yet settled."
      >
        <ReachesBlock rows={reachRows} />
      </BarSection>

      {/* 2b. Signatures (the eight reach powers — yours vs. another incarnation's) */}
      <BarSection
        label="Signatures"
        count={yourSignatureCount}
        open={open.signatures}
        onToggle={() => toggle('signatures')}
        placeholder="Your paths of power are not yet settled."
      >
        <SignaturesBlock paths={signaturePaths} />
      </BarSection>

      {/* 3. Essence */}
      <BarSection
        label="Essence"
        count={essenceRows.length}
        open={open.essence}
        onToggle={() => toggle('essence')}
      >
        <EssenceBlock rows={essenceRows} />
      </BarSection>

      {/* 4. Actions */}
      <BarSection
        label="Actions"
        count={actionCount}
        open={open.actions}
        onToggle={() => toggle('actions')}
        placeholder="No innate actions available."
      >
        <ActionsBlock tray={actionTray} onMove={onMove} onInvestiture={onInvestiture} />
      </BarSection>

      {/* 4b. Covenants (sustained controls the god holds — THR-613 §5.A) */}
      <BarSection
        label="Covenants"
        count={covenantRows.length}
        open={open.covenants}
        onToggle={() => toggle('covenants')}
        placeholder="You hold nothing in a lasting grip."
      >
        <CovenantsBlock rows={covenantRows} onRelease={onReleaseControl} />
      </BarSection>

      {/* 5. Mandate */}
      <BarSection
        label="Mandate"
        open={open.mandate}
        onToggle={() => toggle('mandate')}
        placeholder="Awaiting mandate."
      >
        {mandateRow ? (
          <MandateBlock mandate={mandateRow} onOpen={onOpenMandate} />
        ) : null}
      </BarSection>

      {/* 6. Hooks (conditions / clues / vows) */}
      <BarSection
        label="Hooks"
        count={hookCount}
        open={open.hooks}
        onToggle={() => toggle('hooks')}
        placeholder="No marks, clues, or vows."
      >
        <HooksBlock gameState={gameState} />
      </BarSection>
    </aside>
  );
}
