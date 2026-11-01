/**
 * GOD_RAIL_COMPONENTS — one body per god-rail section (THR-1894, frame plan § F2, § F6).
 *
 * `GOD_RAIL_SECTIONS` (`data/frame-registry.ts`) says which sections exist, in what
 * order and place; this map says how each one draws. It is a `Record<GodRailSectionId,
 * …>`, so a section listed without a body is a type error (Law 58). Adding a row: one
 * entry there, one body here, its data in `engine/views/godRail.ts`.
 */
import type { ReactElement } from 'react';
import type { GameState } from '../../../types/gameState';
import { godRailSectionIcon, type GodRailSectionId } from '../../../data/frame-registry';
import { Chip } from '../../shared/Chip';
import { Icon } from '../../shared/Icon';
import { QuietSlot } from '../../shared/QuietSlot';
import type { GodRailVM } from '../../../engine/views/godRail';
import type { CodexRunStateFilter } from '../../Codex/codexRunState';
import { IdentityStrip } from '../ascendant-bar/IdentityStrip';
import { EssenceBlock } from '../ascendant-bar/EssenceBlock';
import { SeatLine } from '../ascendant-bar/SeatLine';
import { ReachesBlock } from '../ascendant-bar/ReachesBlock';
import { SignaturesBlock } from '../ascendant-bar/SignaturesBlock';
import { CovenantsBlock } from '../ascendant-bar/CovenantsBlock';
import { MandateBlock } from '../ascendant-bar/MandateBlock';
import { HooksBlock } from '../ascendant-bar/HooksBlock';
import { AttentionPoolIndicator } from '../AttentionPoolIndicator';
import { EntityLink } from '../../shared/EntityLink';
import { Tooltip } from '../../shared/Tooltip';
import { sphereWord } from '../../../data/essence-format';
import { REACH_EMPTY_COPY } from '../../../data/ascendant-bar-content';
import { ESSENCE_LABEL, ESSENCE_PRIMARY_LABEL, YOUR_FIRST_LABEL } from '../../../data/frame-content';
import { HandSection, type HandRest } from './HandSection';
import { NEWLY_REVEALED_STYLE } from '../GameView/openingReveal';
import { ATTENTION_GAUGE_SHOWN } from '../../../data/opening-reveal-table';
import { FirstUseCaption, FirstUseCaptionZone } from '../../shared/FirstUseCaption';

/** Everything a section body may read. */
export interface GodRailBag {
  vm: GodRailVM;
  gameState: GameState;
  /** Whether an opening-reveal surface has arrived (THR-1837); omitted means shown. */
  shown: (surface: string) => boolean;
  /** Whether a surface carries the gold reveal ring right now. */
  newly: (surface: string) => boolean;
  handRest: HandRest;
  onOpenSheet: () => void;
  onOpenMandate: () => void;
  onMove?: () => void;
  onInvestiture?: () => void;
  onReleaseControl?: (effectId: string) => void;
  onOpenCodex?: (filter?: CodexRunStateFilter) => void;
  onOpenAttachment?: (templateNodeId: string) => void;
  onCenterOnSeat?: (locationId: string) => void;
}

const labelStyle = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-xs)',
  fontWeight: 700,
  color: 'var(--text-tertiary)',
} as const;

function IdentityBody({ vm, onOpenSheet }: GodRailBag): ReactElement | null {
  if (!vm.identity) return null;
  const { view, quintessence, first } = vm.identity;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <IdentityStrip identity={view} quintessence={quintessence} treatment="breathe" onOpen={onOpenSheet} />
      {/* THR-1828 call 2 — after the bond, The First by name, as an identity link (Laws 1, 21, 56).
          THR-2099 (R6) — with their face: the identity chip, the same tile as their page header. */}
      {first && (
        <div
          data-testid="god-rail-your-first"
          {...(first.visual ? { 'data-rail-face': 'true' } : {})}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', paddingLeft: 8 }}
        >
          <span>{YOUR_FIRST_LABEL}:</span>
          {first.visual ? (
            <Chip role="identity" size="sm" target={{ kind: 'agent', id: first.id }} label={first.name} visual={first.visual} />
          ) : (
            <EntityLink id={first.id} name={first.name} entityRef={{ kind: 'agent', id: first.id }} />
          )}
        </div>
      )}
    </div>
  );
}

function EssenceBody({ vm, shown, newly, onCenterOnSeat }: GodRailBag): ReactElement {
  const primary = vm.essence.primary;
  const att = vm.attention;
  const icon = godRailSectionIcon('essence');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        {/* THR-2099 (R2) — the heading's carved shape, read from its rail row. */}
        <span style={{ ...labelStyle, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {icon && <Icon name={icon} size="floor" decorative />}
          {ESSENCE_LABEL}
        </span>
        {primary && (
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {ESSENCE_PRIMARY_LABEL}:{' '}
            <Tooltip id={`sphere.${primary}`} focusable={false}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{sphereWord(primary)}</span>
            </Tooltip>
          </span>
        )}
      </div>
      {/* THR-1792 — the god's seat, beside the essence it feeds. */}
      <SeatLine seat={vm.essence.seat} onCenter={onCenterOnSeat} />
      {/* THR-1986 — the essence caption, until the player hovers or uses a row once. */}
      <FirstUseCaptionZone id="essence">
        <EssenceBlock rows={vm.essence.rows} />
        <FirstUseCaption id="essence" />
      </FirstUseCaptionZone>
      {/* THR-1894 — Attention moved here from the top bar, under the essence it spends beside.
          THR-2060 — hidden while nothing spends Attention (a gauge that never moves); the rail closes the gap.
          THR-2062 — shown once a mortal on *Lives on* is in the court, the only tug that costs Attention. */}
      {ATTENTION_GAUGE_SHOWN && shown('attention') && att.spendable && (
        <div
          data-testid="god-rail-attention"
          {...(newly('attention') ? { 'data-newly-revealed': 'true', style: NEWLY_REVEALED_STYLE } : {})}
        >
          <FirstUseCaptionZone id="attention">
            <AttentionPoolIndicator
              placement="rail"
              attentionPool={att.pool}
              attentionCapacity={att.capacity}
              attentionRegen={0}
            />
            <FirstUseCaption id="attention" />
          </FirstUseCaptionZone>
        </div>
      )}
    </div>
  );
}

function HandBody({ vm, shown, newly, handRest, onMove, onInvestiture }: GodRailBag): ReactElement {
  return (
    <HandSection
      hand={vm.hand}
      showInvestiture={shown('investiture')}
      investitureNewlyRevealed={newly('investiture')}
      onMove={onMove}
      onInvestiture={onInvestiture}
      rest={handRest}
    />
  );
}

function ReachesBody({ vm, shown }: GodRailBag): ReactElement {
  // THR-1986 — Dominion arrives with the Reaches it is read with; its caption rides here.
  const captions = (
    <>
      <FirstUseCaption id="reaches" />
      {shown('dominion') && <FirstUseCaption id="dominion" />}
    </>
  );
  if (vm.bodies.reaches.length === 0) {
    // THR-2099 (R8) — the empty line in a quiet slot; the words are unchanged.
    return (
      <QuietSlot data-testid="god-rail-reaches-empty" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: '4px 8px' }}>
        {REACH_EMPTY_COPY}{captions}
      </QuietSlot>
    );
  }
  return (
    <FirstUseCaptionZone id="reaches">
      <ReachesBlock rows={vm.bodies.reaches} />
      {captions}
    </FirstUseCaptionZone>
  );
}

function MandateBody({ vm, onOpenMandate }: GodRailBag): ReactElement | null {
  return vm.bodies.mandate ? <MandateBlock mandate={vm.bodies.mandate} onOpen={onOpenMandate} /> : null;
}

function CovenantsBody({ vm, onReleaseControl }: GodRailBag): ReactElement {
  return <CovenantsBlock rows={vm.bodies.covenants} onRelease={onReleaseControl} />;
}

function SignaturesBody({ vm, onOpenCodex }: GodRailBag): ReactElement {
  return <SignaturesBlock paths={vm.bodies.signatures} onOpenCodex={onOpenCodex} />;
}

function HooksBody({ gameState, onOpenAttachment }: GodRailBag): ReactElement {
  return <HooksBlock gameState={gameState} onOpenAttachment={onOpenAttachment} />;
}

export const GOD_RAIL_COMPONENTS: Record<GodRailSectionId, (bag: GodRailBag) => ReactElement | null> = {
  identity: IdentityBody,
  essence: EssenceBody,
  hand: HandBody,
  reaches: ReachesBody,
  mandate: MandateBody,
  covenants: CovenantsBody,
  signatures: SignaturesBody,
  hooks: HooksBody,
};
