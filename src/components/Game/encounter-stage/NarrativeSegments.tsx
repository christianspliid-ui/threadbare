/**
 * NarrativeSegments — the UI Law's link + tooltip halves for a segmented
 * paragraph (THR-1084).
 *
 * A linked paragraph carries three tiers per segment, and every surface that
 * draws one owes the same three:
 *
 *   1. **click** — a named entity whose id resolved *and* whose kind this host
 *      can open (Law 21, routed by kind: agent → agent surface, faction →
 *      faction sheet, artifact → artifact sheet);
 *   2. **hover** — a concept the tooltip registry can explain (Laws 1, 17);
 *   3. **plain** — everything else, fail-open, never a dead affordance.
 *
 * The rules are the ones `EncounterVeil`'s consequence chips already settled
 * (THR-971/1004/1033): the underline is drawn on what the surface can actually
 * *do*, never on the mere presence of an id — drawing it on an id alone is what
 * once made every STANDING chip look live and do nothing.
 *
 * ## The nested-interaction decision (THR-1084)
 *
 * A reaction label lives inside the `<button>` that picks that reaction, so a
 * link inside it is a click target inside a click target. Three things follow,
 * and they are the reason this component exists rather than an inline copy:
 *
 * - **The entity is still clickable.** Law 21 is `[E]`-enforced and carries no
 *   "unless it sits inside a control" exception, and the defect this ticket was
 *   filed for is precisely that the same entity linked one line above and did
 *   not here — inside one modal, on one screen.
 * - **It is a `<span role="link">`, never a nested `<button>`.** A `<button>`
 *   inside a `<button>` is invalid HTML: the button content model forbids
 *   interactive content, and browsers diverge on what they do with it. A span
 *   is not interactive content, so the nesting is valid and the keyboard
 *   contract is ours to state explicitly.
 * - **The outer control keeps every other pixel.** `nested` makes the link stop
 *   propagation (and `preventDefault` on Space, which would otherwise activate
 *   the button underneath), so the pick still fires everywhere except on the
 *   entity's own name — one small, gold-underlined, visually-marked exception
 *   rather than an ambiguous surface.
 *
 * `EncounterVeil`'s consequence-chip block adopted this component in THR-1105,
 * once PR #1415 (THR-1082) landed and stopped the rewrite from conflicting.
 * There is now one implementation of the three-tier rule and no second site;
 * a surface that needs these tiers renders this rather than copying it.
 */

import type { CSSProperties } from 'react';
import { Tooltip } from '../../shared/Tooltip';
import { tooltipResolves } from '../../../engine/tooltipResolver';
import type { EncounterStageNarrativeParagraph } from './types';

export type NarrativeEntityKind =
  | 'agent'
  | 'faction'
  | 'artifact'
  | 'companion'
  // THR-1120 — a granted condition/blessing/curse/power, named by its template
  // node id. Routed to the attachment sheet; see `EncounterVeil`'s `openEntity`.
  | 'attachment';

export interface NarrativeSegmentsProps {
  paragraph: EncounterStageNarrativeParagraph;
  /**
   * Resolves a segment's click handler, or `undefined` when this host cannot
   * open that kind. Returning `undefined` is the fail-open path: the name stays
   * emphasised text rather than becoming a link that opens the wrong drawer.
   */
  openEntity: (
    entityId: string | undefined,
    kind: NarrativeEntityKind | undefined,
  ) => (() => void) | undefined;
  /** Colour of a live link. */
  linkColor: string;
  /** Underline drawn under anything that clicks or explains. */
  underlineColor: string;
  /** Colour of text that explains itself but does not navigate. */
  plainColor: string;
  /**
   * True when these segments sit inside an outer click target. See the
   * nested-interaction decision above: a link stops propagation so the outer
   * control's own action does not fire alongside the navigation.
   */
  nested?: boolean;
  /** Prefix for per-segment test ids; omitted ⇒ no test ids emitted. */
  testIdPrefix?: string;
}

export function NarrativeSegments({
  paragraph,
  openEntity,
  linkColor,
  underlineColor,
  plainColor,
  nested = false,
  testIdPrefix,
}: NarrativeSegmentsProps) {
  return (
    <>
      {paragraph.segments.map((seg, i) => {
        const open = openEntity(seg.entityId, seg.entityKind);
        const explains = tooltipResolves(seg.tooltipId);
        const testId = testIdPrefix ? `${testIdPrefix}-seg-${i}` : undefined;

        const linkStyle: CSSProperties = {
          background: 'none',
          border: 'none',
          padding: 0,
          font: 'inherit',
          color: linkColor,
          borderBottom: `1px solid ${underlineColor}`,
          cursor: 'pointer',
        };

        let body;
        if (open && nested) {
          // Inside an outer control: a span carrying the link role, so the
          // nesting stays valid HTML. Both activation paths stop propagation —
          // the outer button must not also fire — and Space additionally
          // preventDefaults, because a bare Space would scroll or activate the
          // button underneath.
          body = (
            <span
              className="focus-ring"
              role="link"
              tabIndex={0}
              data-testid={testId}
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  open();
                }
              }}
              style={{ ...linkStyle, borderBottom: `1px solid ${underlineColor}` }}
            >
              {seg.text}
            </span>
          );
        } else if (open) {
          body = (
            <button
              className="focus-ring"
              type="button"
              data-testid={testId}
              onClick={open}
              style={linkStyle}
            >
              {seg.text}
            </button>
          );
        } else {
          body = (
            <span
              // Focusable only when it has something to say, so the hover tier
              // is reachable from the keyboard too — a tooltip nobody can open
              // is inert by another name (Laws 17/23).
              className={explains ? 'focus-ring' : undefined}
              tabIndex={explains ? 0 : undefined}
              data-testid={testId}
              style={
                seg.referenceId || explains
                  ? { color: plainColor, borderBottom: `1px solid ${underlineColor}` }
                  : undefined
              }
            >
              {seg.text}
            </span>
          );
        }

        return explains ? (
          <Tooltip key={i} id={seg.tooltipId}>
            {body}
          </Tooltip>
        ) : (
          <span key={i}>{body}</span>
        );
      })}
    </>
  );
}
