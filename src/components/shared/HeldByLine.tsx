/**
 * HeldByLine — whose writ runs over this place (THR-1155 § UI).
 *
 * One component for both surfaces that carry the line (the location profile and the hex
 * chronicle) because the alternative is two renderings of one fact that drift: the
 * chronicle would learn about seats a release after the sheet did, and a player would
 * meet the same town twice and be told two different things about who holds it.
 *
 * **The three parts the Done-when names, and why each is there.** The *image* is the
 * holder's own sigil through `EntityVisual` — a Realm is a thing in the world with a
 * face, and a name alone reads as metadata (Law 26/27). The *tooltip* is the one
 * registry entry `ui.held_by`, because *held by* is a concept a player has to learn
 * once and then reads everywhere (Law 3/17). The *link* opens the holder's own sheet,
 * so the line is a door rather than a label — and it degrades to plain text on a
 * surface that cannot route, which is `EntityLink`'s load-bearing half.
 *
 * **Unclaimed is a designed state, not an absence.** A place no faction holds renders
 * the word rather than nothing: wilderness is a fact about the world — it is why the
 * border stops — and a blank row would read as a surface that failed to load (Law 4).
 */

import { EntityVisual } from './EntityVisual';
import { EntityLink } from './EntityLink';
import { Tooltip } from './Tooltip';
import { ListRow } from './ListRow';
import {
  REALM_HELD_BY_LABEL,
  REALM_SEAT_COPY,
  REALM_UNCLAIMED_COPY,
} from '../../data/realm-content';
import type { LocationHolder } from '../../engine/realmHolder';
import type { WorldGraph } from '../../engine/graph';

interface HeldByLineProps {
  /** The answer from `getLocationHolder` — `null` renders the unclaimed line. */
  holder: LocationHolder | null;
  /** Resolves the holder's sigil. Omitted → the designed faction glyph. */
  graph?: WorldGraph | null;
  /** Absent on surfaces that cannot open a faction sheet; the name then reads as text. */
  onOpenFaction?: (factionId: string) => void;
  'data-testid'?: string;
}

export function HeldByLine({
  holder,
  graph,
  onOpenFaction,
  'data-testid': testId = 'held-by-line',
}: HeldByLineProps) {
  return (
    <div data-testid={testId}>
      <ListRow
        trailing={
          holder?.isSeat ? (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                whiteSpace: 'nowrap',
                fontStyle: 'italic',
              }}
              data-testid="held-by-seat"
            >
              {REALM_SEAT_COPY}
            </span>
          ) : undefined
        }
      >
        {holder && (
          <ListRow.Leading>
            <EntityVisual
              size="chip"
              entity={{ id: holder.id, kind: 'faction', name: holder.name }}
              graph={graph ?? null}
              data-testid="held-by-visual"
            />
          </ListRow.Leading>
        )}
        <Tooltip id="ui.held_by">
          <ListRow.Title>{REALM_HELD_BY_LABEL}</ListRow.Title>
        </Tooltip>
        {holder ? (
          <EntityLink id={holder.id} name={holder.name} onOpenEntity={onOpenFaction} />
        ) : (
          <span
            style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 'var(--text-sm)' }}
            data-testid="held-by-unclaimed"
          >
            {REALM_UNCLAIMED_COPY}
          </span>
        )}
      </ListRow>
    </div>
  );
}
