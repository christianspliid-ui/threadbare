import React from 'react';
import {
  EiraHeroPanel,
  type EncounterHeroPanelData,
} from './EiraHeroPanel';

export const ENCOUNTER_SCREEN_LAYOUT = {
  HERO_PANEL_WIDTH_PX: 440,
  RIGHT_RAIL_WIDTH_PX: 540,
  BOTTOM_STRIP_HEIGHT_PX: 100,
  SHELL_GAP_PX: 16,
  SHELL_PADDING_PX: 16,
} as const;

interface EncounterScreenProps {
  heroPanel: EncounterHeroPanelData;
  centerColumn: React.ReactNode;
  rightRail: React.ReactNode;
  bottomStrip: React.ReactNode;
  header?: React.ReactNode;
  onOpenHeroProfile?: () => void;
  heroPanelRegistrationSlot?: React.ReactNode;
  className?: string;
}

export function EncounterScreen({
  heroPanel,
  centerColumn,
  rightRail,
  bottomStrip,
  header,
  onOpenHeroProfile,
  heroPanelRegistrationSlot,
  className,
}: EncounterScreenProps) {
  return (
    <section
      data-testid="encounter-screen-shell"
      className={className}
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: ENCOUNTER_SCREEN_LAYOUT.SHELL_PADDING_PX,
        gap: ENCOUNTER_SCREEN_LAYOUT.SHELL_GAP_PX,
        background: 'var(--bg-abyss)',
      }}
    >
      {header ? <div data-testid="encounter-screen-header">{header}</div> : null}

      <div
        style={{
          minHeight: 0,
          flex: 1,
          display: 'grid',
          gridTemplateColumns: `${ENCOUNTER_SCREEN_LAYOUT.HERO_PANEL_WIDTH_PX}px minmax(0, 1fr) ${ENCOUNTER_SCREEN_LAYOUT.RIGHT_RAIL_WIDTH_PX}px`,
          gap: ENCOUNTER_SCREEN_LAYOUT.SHELL_GAP_PX,
          overflow: 'hidden',
        }}
      >
        <EiraHeroPanel
          data={heroPanel}
          onOpenProfile={onOpenHeroProfile}
          registrationSlot={heroPanelRegistrationSlot}
        />

        <div
          data-testid="encounter-screen-center-column"
          style={{
            minHeight: 0,
            borderRadius: 12,
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            overflow: 'hidden',
          }}
        >
          {centerColumn}
        </div>

        <div
          data-testid="encounter-screen-right-rail"
          style={{
            minHeight: 0,
            borderRadius: 12,
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            overflow: 'hidden',
          }}
        >
          {rightRail}
        </div>
      </div>

      <div
        data-testid="encounter-screen-bottom-strip"
        style={{
          minHeight: ENCOUNTER_SCREEN_LAYOUT.BOTTOM_STRIP_HEIGHT_PX,
          maxHeight: ENCOUNTER_SCREEN_LAYOUT.BOTTOM_STRIP_HEIGHT_PX,
          borderRadius: 12,
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-deep)',
          overflow: 'hidden',
        }}
      >
        {bottomStrip}
      </div>
    </section>
  );
}
