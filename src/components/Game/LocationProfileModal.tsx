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
import { clampRarityTier } from '../../types/rarity';
import { locationSubtypeName } from '../../data/location-words';
import type { TerrainType } from '../../types';
import type { SphereInfluence } from '../../engine/hexZoom';
import type { WorldGraph } from '../../engine/graph';

interface LocationProfileModalProps {
  name: string;
  onClose: () => void;
  /** Graph node id — enables the visual and the information block. */
  locationId?: string;
  graph?: WorldGraph | null;
}

/** Copy shown when the graph holds no prose for this place (a designed state, Law 4). */
const NO_DETAIL_COPY = 'Nothing further is recorded of this place yet.';

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
        </div>
      </Modal.Body>
    </Modal>
  );
});

LocationProfileModal.displayName = 'LocationProfileModal';
