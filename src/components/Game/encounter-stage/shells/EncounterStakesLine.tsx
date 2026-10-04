/**
 * EncounterStakesLine — THR-1727.
 *
 * The encounter's one-sentence stakes line, in the veil's subtitle slot under the
 * title row: `[lead], [actor] must [goal] — or [risk].`
 *
 * Replaces two texts that used to sit at the top of the veil: the template's
 * hand-written summary (`template.description`) and the THR-972 motive intro line
 * (`NudgeMotiveIntro`, retired). The line keeps the subtitle's typography; the
 * acting mortal's name, and the place the `chance` lead names, are links to their
 * own cards (Laws 1 and 21).
 *
 * Plan: `Docs/plans/2026-10-04-thr-1727-encounter-stakes-line.md` § UI pillar
 */

import type { CSSProperties, ReactNode } from 'react';
import { EntityLink } from '../../../shared/EntityLink';
import type { EncounterStageStakesLineModel } from '../types';

export interface EncounterStakesLineProps {
  line: EncounterStageStakesLineModel;
  style?: CSSProperties;
  onSelectAgent?: (agentId: string) => void;
  onSelectLocation?: (locationId: string) => void;
}

interface LinkSpan {
  readonly name: string;
  readonly render: () => ReactNode;
}

/**
 * Split `text` at the first occurrence of each linked name, in reading order. A
 * name the text does not contain (enrichment reworded it) simply stays unlinked.
 */
function linkify(text: string, spans: readonly LinkSpan[]): ReactNode[] {
  const hits = spans
    .map(span => ({ span, at: span.name ? text.indexOf(span.name) : -1 }))
    .filter(h => h.at >= 0)
    .sort((a, b) => a.at - b.at);

  const out: ReactNode[] = [];
  let cursor = 0;
  for (const { span, at } of hits) {
    if (at < cursor) continue; // overlapping names: the earlier one wins
    if (at > cursor) out.push(text.slice(cursor, at));
    out.push(<span key={`${span.name}@${at}`}>{span.render()}</span>);
    cursor = at + span.name.length;
  }
  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
}

export function EncounterStakesLine({ line, style, onSelectAgent, onSelectLocation }: EncounterStakesLineProps) {
  const spans: LinkSpan[] = [
    {
      name: line.actorName,
      render: () => (
        <EntityLink
          id={line.actorId}
          name={line.actorName}
          entityRef={{ kind: 'agent', id: line.actorId }}
          onOpenEntity={onSelectAgent}
        />
      ),
    },
  ];
  if (line.locationId && line.locationName) {
    const locationId = line.locationId;
    spans.push({
      name: line.locationName,
      render: () => (
        <EntityLink
          id={locationId}
          name={line.locationName!}
          entityRef={{ kind: 'location', id: locationId }}
          onOpenEntity={onSelectLocation}
        />
      ),
    });
  }

  return (
    <div
      data-testid="encounter-stakes-line"
      data-lead-source={line.leadSource}
      style={style}
    >
      {linkify(line.text, spans)}
    </div>
  );
}
