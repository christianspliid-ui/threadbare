/**
 * PastLineText — one line of the world's past, rendered from its segments (THR-1656).
 *
 * The producer (`engine/worldPastWords.ts`) declares every concept in the sentence (Law 2):
 * a segment with a `ref` is a name, linked through the one router by `EntityLink` (Law 21);
 * a segment with only a `tooltipId` is a concept word, explained from the one registry
 * (Law 17). This component never looks inside the English.
 *
 * Shared by the three surfaces the past reaches: the chronicle's "Before you woke", the
 * place line on a settlement or ruin page, and the line on a dead person's sheet.
 */

import type { CSSProperties } from 'react';
import type { PastLine } from '../../engine/worldPastWords';
import { EntityLink } from '../shared/EntityLink';
import { Tooltip } from '../shared/Tooltip';

interface PastLineTextProps {
  line: PastLine;
  /** The `data-testid` the surface is asserted by. */
  testId?: string;
  style?: CSSProperties;
}

const CONCEPT_STYLE: CSSProperties = {
  textDecoration: 'underline dotted',
  textUnderlineOffset: '2px',
  cursor: 'help',
};

export function PastLineText({ line, testId, style }: PastLineTextProps) {
  return (
    <p data-testid={testId} data-past-line={line.id} style={{ margin: 0, ...style }}>
      {line.segments.map((seg, i) => {
        if (seg.ref) {
          return <EntityLink key={i} id={seg.ref.id} name={seg.text} entityRef={seg.ref} />;
        }
        if (seg.tooltipId) {
          return (
            <Tooltip key={i} id={seg.tooltipId}>
              <span style={CONCEPT_STYLE}>{seg.text}</span>
            </Tooltip>
          );
        }
        return <span key={i}>{seg.text}</span>;
      })}
      {line.quote && (
        <span
          style={{
            display: 'block',
            marginTop: '2px',
            fontStyle: 'italic',
            color: 'var(--text-tertiary)',
          }}
        >
          &ldquo;{line.quote}&rdquo;
        </span>
      )}
    </p>
  );
}
