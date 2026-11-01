/**
 * StageSubjectPortrait — the one face every Stage moment draws (THR-2100, plan § S4.1).
 *
 * Draws `vm.subjectVisual`, the descriptor `buildStageView` resolved with the knowledge
 * gate (`mortalFace`). It is handed the descriptor and never a graph, so the gate is never
 * re-opened here: a mortal below `recognised` is the silhouette on the Stage and on their
 * page alike (Law 8, PC-6). One size, `--stage-subject-portrait-w`, 3:4 (Law 5).
 *
 * Clicking opens the mortal's page through the Stage's router (the Inspector over the
 * Stage, § D7); with no router (a lab, a test) the face is a picture, not a control
 * (Law 21). Nothing to draw → nothing rendered (fail-soft).
 */
import type { EntityVisualDescriptor } from '../../../engine/views/entityVisualResolver';
import type { RefRow } from '../../../engine/views/types';
import { useRefRouterContext } from '../../../contexts/RefRouterContext';
import { EntityVisual } from '../../shared/EntityVisual';

export interface StageSubjectPortraitProps {
  visual: EntityVisualDescriptor | null | undefined;
  /** The subject's row, for the route; absent → the face is not a control. */
  subject?: RefRow | null;
  /** Overrides the router (the encounter opens the sheet through its own callback). */
  onOpen?: () => void;
  /** The tile's accessible name when it is a control ("Open Maren's page"); defaults to the face's alt. */
  'aria-label'?: string;
  /** Test hook on the tile (surfaces keep their historical ids). */
  'data-testid'?: string;
}

export function StageSubjectPortrait({ visual, subject, onOpen, 'aria-label': ariaLabel, 'data-testid': testId }: StageSubjectPortraitProps) {
  const router = useRefRouterContext();
  if (!visual) return null;
  const open = onOpen ?? (subject && router ? () => router.open(subject.ref, 'card', { via: 'stage' }) : undefined);
  return (
    <div
      data-stage-face={visual.tier}
      data-testid="stage-subject-portrait"
      data-subject-id={subject?.ref.id}
      style={{ width: 'var(--stage-subject-portrait-w)', flexShrink: 0 }}
    >
      <EntityVisual
        size="portrait"
        shape="rounded"
        descriptor={visual}
        onClick={open}
        title={open ? visual.alt : undefined}
        aria-label={ariaLabel}
        data-testid={testId}
      />
    </div>
  );
}
