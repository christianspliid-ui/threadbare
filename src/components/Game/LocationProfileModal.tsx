/**
 * LocationProfileModal (THR-1023) — the detail surface for a place, built to the
 * same artifact-representation pattern THR-1009 gave `ArtifactSheet`: **canonical
 * visual + identity block + player-relevant information**
 * (`Docs/design-system/artifact-representation.md`, registry row "Location / Hex").
 *
 * Until THR-1023 this was a stub reading "Full location profile coming in a
 * future update", reached from at least two live surfaces (`HexSidebar`'s
 * `onLocationClick` and `HexDetailView`'s kind-routed location rows) — a
 * live-looking link to an empty page, which is the failure UI Law 21 names.
 * The fix is to render what the graph already holds, not to remove the link.
 *
 * **Terrain needs no plumbing.** `resolveEntityVisual` returns null for a
 * location without a `terrain` hint, and THR-1023 assumed the caller would have
 * to thread one through. It does not: every location node carries `terrain` in
 * its own property bag (verified via CLI, seed 42 medium — `loc_0` is
 * `temperate_forest`), so the modal reads it from the node and the callers stay
 * unchanged.
 *
 * **What is deliberately NOT rendered:** `prosperity` (a raw float, 48.5085…),
 * `importance`, `resourceBalance`, `populationLagTicks`, `econLastProsperity`.
 * Law 13 bars raw magnitudes from any mortal-facing surface; the player gets the
 * place's archetype prose and its banded standing instead.
 *
 * NFP #4 (fail-soft): a node the graph cannot resolve, one with no terrain, and
 * one with no prose each still render a visual, a name and a designed absence
 * line — never a blank body.
 */

import React from 'react';
import { Modal } from '../shared/Modal';
import { EntityVisual } from '../shared/EntityVisual';
import { RarityBadge } from '../shared/RarityBadge';
import { SectionHeading } from '../shared/SectionHeading';
import { ListRow } from '../shared/ListRow';
import { Tooltip } from '../shared/Tooltip';
import { clampRarityTier } from '../../types/rarity';
import { locationSubtypeName } from '../../data/location-words';
import { durationLabel } from '../../engine/aftermathWords';
import type { TerrainType } from '../../types';
import type { SphereInfluence } from '../../engine/hexZoom';
import type { WorldGraph } from '../../engine/graph';
import { getReputationWith } from '../../engine/reputation';

interface LocationProfileModalProps {
  name: string;
  onClose: () => void;
  /** Graph node id — enables the visual and the information block. */
  locationId?: string;
  graph?: WorldGraph | null;
  /**
   * The agent whose standing with this place is shown (THR-1206) — the avatar, on
   * every live route.
   *
   * The modal was written location-absolute, which is why standing needed a viewer
   * threaded in at all: "how this place regards you" is the one thing on the sheet
   * that is not a property of the place. Omitted → the Standing row does not render,
   * which is the correct behaviour for a surface with no viewer (the codex, tests).
   */
  viewerAgentId?: string;
}

/** Copy shown when the graph holds no prose for this place (a designed state, Law 4). */
const NO_DETAIL_COPY = 'Nothing further is recorded of this place yet.';

/** A condition with no `ticksRemaining` on its edge — it holds until a story lifts it. */
const INDEFINITE_TERM_COPY = 'until it lifts';

/** What a place's active conditions are read off (THR-1143). */
interface ActiveLocationCondition {
  edgeId: string;
  templateId: string;
  /** The condition's own display name from its definition node. */
  name: string;
  /** Remaining term in words — never ticks (Law 13/14). */
  term: string;
}

/**
 * Read the conditions currently sitting on this place (THR-1143).
 *
 * Reader-side of the primitive: the same `has_trait` edges the aftermath writes
 * and `decayConditions` counts down, so the panel needs no state of its own and
 * cannot drift from the engine — an expired condition disappears here because the
 * edge is gone, not because a second bookkeeping path was kept in step.
 *
 * Sorted by remaining term, soonest first, so what is about to lift reads first;
 * indefinite conditions sort last. NFP #4: a dangling edge whose definition node
 * is missing is skipped rather than rendered as its raw id (Law 14).
 */
function readActiveConditions(
  graph: WorldGraph,
  locationId: string,
): ActiveLocationCondition[] {
  const rows: (ActiveLocationCondition & { sortKey: number })[] = [];
  for (const edge of graph.getOutgoingEdges(locationId, 'has_trait')) {
    const def = graph.getNode(edge.target);
    if (!def) continue;
    if ((def.properties?.subcategory as string) !== 'condition') continue;
    const remaining = edge.properties?.ticksRemaining;
    const hasTerm = typeof remaining === 'number' && remaining > 0;
    rows.push({
      edgeId: edge.id,
      templateId: edge.target,
      name: def.name ?? edge.target,
      term: hasTerm ? durationLabel(remaining) : INDEFINITE_TERM_COPY,
      sortKey: hasTerm ? remaining : Number.POSITIVE_INFINITY,
    });
  }
  rows.sort((a, b) => a.sortKey - b.sortKey || a.name.localeCompare(b.name));
  return rows.map(({ sortKey: _sortKey, ...row }) => row);
}

/** Sentence-case an authored prose fragment ("power flows downhill from these walls"). */
function asSentence(fragment: string): string {
  const trimmed = fragment.trim();
  if (!trimmed) return '';
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

export const LocationProfileModal = React.memo(function LocationProfileModal({
  name,
  onClose,
  locationId,
  graph,
  viewerAgentId,
}: LocationProfileModalProps) {
  const node = locationId && graph ? graph.getNode(locationId) : undefined;
  const props = node?.properties ?? {};

  const kindLine = locationSubtypeName(props.locationSubtype);
  const tier = typeof props.rarityTier === 'number' ? clampRarityTier(props.rarityTier) : null;
  const archetype = typeof props.archetypeName === 'string' ? props.archetypeName : null;
  const flavor =
    typeof props.archetypeProseFlavor === 'string' && props.archetypeProseFlavor.trim()
      ? asSentence(props.archetypeProseFlavor)
      : null;

  // Hints the concept-art scorer needs; both live on the location node itself.
  const terrain = typeof props.terrain === 'string' ? (props.terrain as TerrainType) : undefined;
  const sphereInfluence = (props.sphereInfluence ?? null) as SphereInfluence | null;

  // THR-1206 — the viewer's reputation with this place, in the one word vocabulary
  // every standing on every surface shares. `source: 'default'` means nothing has
  // happened between them, and a row reading "Accepted" for every town the player has
  // never visited is noise, not information — so absence is designed (Law 4), not a
  // placeholder.
  const standing = React.useMemo(
    () => {
      if (!graph || !locationId || !viewerAgentId) return null;
      const reading = getReputationWith(graph, viewerAgentId, locationId);
      return reading.source === 'default' ? null : reading;
    },
    // Same in-place-mutation reasoning as `conditions` below: the modal remounts per
    // open, and that is this surface's refresh.
    [graph, locationId, viewerAgentId],
  );

  // THR-1143 — what the world has done to this place, and for how much longer.
  const conditions = React.useMemo(
    () => (node && graph && locationId ? readActiveConditions(graph, locationId) : []),
    // `graph` is mutated in place, so its identity is not a change signal (the
    // load-bearing rule). The modal is short-lived and remounts per open, which is
    // the surface's refresh; a live subscription belongs to the panel, not here.
    [node, graph, locationId],
  );

  return (
    <Modal open={true} onClose={onClose} aria-label={`${name} profile`}>
      <Modal.Header onClose={onClose}>{name}</Modal.Header>
      <Modal.Body>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {/* Canonical visual — 16:9 concept-art landscape when terrain resolves,
              else the designed location glyph tile. Both come from resolveEntityVisual. */}
          {locationId && (
            <EntityVisual
              size="hero"
              entity={{ id: locationId, kind: 'location', name }}
              graph={graph ?? null}
              opts={{ terrain, sphereInfluence }}
              data-testid="location-profile-visual"
            />
          )}

          {/* Identity block — what kind of place this is, and its standing, in words. */}
          {(kindLine || tier || archetype) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-display)',
                fontVariant: 'small-caps',
                letterSpacing: '0.05em',
                color: 'var(--text-tertiary)',
              }}
              data-testid="location-profile-identity"
            >
              {tier && <RarityBadge tier={tier} />}
              {kindLine && tier && <span aria-hidden="true">·</span>}
              {kindLine && <span>{kindLine}</span>}
              {archetype && (kindLine || tier) && <span aria-hidden="true">·</span>}
              {archetype && <span>{archetype}</span>}
            </div>
          )}

          {/* Information — the place's own prose, or the designed absence line. */}
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              lineHeight: 1.5,
              color: flavor ? 'var(--text-secondary)' : 'var(--text-muted)',
              fontStyle: flavor ? 'normal' : 'italic',
            }}
            data-testid="location-profile-prose"
          >
            {flavor ?? NO_DETAIL_COPY}
          </p>

          {/* Standing (THR-1206) — the social score between the viewer and this place,
              as a word and never a number (Law 13). The tooltip is the one registry
              entry that covers standing with a person, a faction and a place alike,
              which is the whole point of the unification: one concept to learn. */}
          {standing && (
            <div data-testid="location-profile-standing">
              <SectionHeading>Standing</SectionHeading>
              <ListRow
                trailing={
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {standing.band}
                  </span>
                }
              >
                <Tooltip id="ui.reputation_with">
                  <ListRow.Title>Your reputation here</ListRow.Title>
                </Tooltip>
              </ListRow>
            </div>
          )}

          {/* Active conditions (THR-1143) — the place's timed states, each hoverable
              through the one tooltip registry (`attachment.*`, Laws 3/17) and each
              carrying its remaining term in words (Law 13). The section renders only
              when the place has conditions: a heading over an empty list is a control
              that does nothing (Law 25), and most places have none. */}
          {conditions.length > 0 && (
            <div data-testid="location-profile-conditions">
              <SectionHeading count={conditions.length}>Conditions</SectionHeading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {conditions.map(condition => (
                  <ListRow
                    key={condition.edgeId}
                    trailing={
                      <span
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-tertiary)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {condition.term}
                      </span>
                    }
                  >
                    <Tooltip id={`attachment.${condition.templateId}`}>
                      <ListRow.Title>{condition.name}</ListRow.Title>
                    </Tooltip>
                  </ListRow>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
});

LocationProfileModal.displayName = 'LocationProfileModal';
