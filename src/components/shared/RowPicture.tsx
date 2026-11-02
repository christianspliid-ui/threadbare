/**
 * RowPicture (THR-2103, art-led pass slice 7, S7.2) — the picture a list row leads with.
 *
 * Draws a host-resolved `EntityVisualDescriptor` at chip size (40px, Law 5): a circle for a
 * person, the control-radius tile for a place, faction, army or relic. No descriptor draws nothing,
 * so a row without a subject keeps its look. The row itself carries `rowDressingAttrs`, which
 * `__DEBUG.getListDressing()` reads.
 */
import type { CSSProperties } from 'react';
import { EntityVisual } from './EntityVisual';
import { isPersonRowVisual } from '../../engine/views/rowVisual';
import type { EntityVisualDescriptor } from '../../engine/views/entityVisualResolver';

/** The debug attributes a dressed row carries: its subject's kind and the picture's tier. */
export function rowDressingAttrs(
  visual: EntityVisualDescriptor | null | undefined,
  namesSubject = !!visual,
): Record<string, string> {
  if (!namesSubject) return {};
  return {
    'data-row-subject': visual?.kind ?? 'unknown',
    'data-row-art': visual ? visual.tier : 'none',
  };
}

export function RowPicture({
  visual,
  style,
  testId,
}: {
  visual: EntityVisualDescriptor | null | undefined;
  style?: CSSProperties;
  testId?: string;
}) {
  if (!visual) return null;
  return (
    <EntityVisual
      size="chip"
      descriptor={visual}
      // A person is a circle (the chip default); a place, faction, army or relic takes the control radius token.
      style={isPersonRowVisual(visual) ? style : { borderRadius: 'var(--radius-control)', ...style }}
      data-testid={testId ?? 'row-picture'}
    />
  );
}
