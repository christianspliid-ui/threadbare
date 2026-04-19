/**
 * AscendantBar — persistent left rail (360 px) for the hexmap screen.
 *
 * Shows ascendant self-state: identity + quintessence, essence, actions,
 * mandate, and hooks (conditions / clues / vows). Five foldable sections.
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
import { ActionsBlock } from './ActionsBlock';
import { MandateBlock } from './MandateBlock';
import { HooksBlock } from './HooksBlock';
import {
  selectAscendantIdentityView,
  selectQuintessenceView,
  selectEssenceRows,
  selectActionTray,
  selectMandateRow,
} from './selectors';
import styles from './styles.module.css';

// ── Default section open/closed state (NFP #1: tunability) ──────────────────
const ASCENDANT_BAR_SECTION_DEFAULT_OPEN = {
  identity: true,
  essence: true,
  actions: true,
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

      {/* 2. Essence */}
      <BarSection
        label="Essence"
        count={essenceRows.length}
        open={open.essence}
        onToggle={() => toggle('essence')}
      >
        <EssenceBlock rows={essenceRows} />
      </BarSection>

      {/* 3. Actions */}
      <BarSection
        label="Actions"
        count={actionCount}
        open={open.actions}
        onToggle={() => toggle('actions')}
        placeholder="No innate actions available."
      >
        <ActionsBlock tray={actionTray} onMove={onMove} onInvestiture={onInvestiture} />
      </BarSection>

      {/* 4. Mandate */}
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

      {/* 5. Hooks (conditions / clues / vows) */}
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
