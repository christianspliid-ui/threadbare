/**
 * ArtifactSheet (THR-1009) — the detail surface for a possession or legendary
 * artifact, built to the artifact-representation pattern: **canonical visual +
 * identity block + player-relevant information**
 * (`Docs/design-system/artifact-representation.md`, registry row "Artifact").
 *
 * Until THR-1009 this was a stub reading "Full artifact sheet coming in a future
 * update", which made every artifact link in the game a live-looking link to an
 * empty page — the failure UI Law 21 names explicitly ("a dead link that looks
 * live"). The fix is to render what the graph already holds rather than to
 * remove the link.
 *
 * **What is deliberately NOT rendered:** `properties.mechanicalSummary`. It is
 * an authoring aid carrying raw magnitudes ("+0.03 Gold, 10% reduced movement
 * cost"), and Law 13 bars raw magnitudes and percentages from any mortal-facing
 * surface. The player gets the item's flavour prose and its banded tier instead;
 * the numbers stay where they belong, in the data and the designer view.
 *
 * NFP #4 (fail-soft): every field is optional in practice. A node the graph
 * cannot resolve, or one carrying no prose, still renders its visual, its name
 * and a designed "nothing further recorded" line — never a blank body.
 */

import React from 'react';
import { Modal } from '../shared/Modal';
import { EntityVisual } from '../shared/EntityVisual';
import { RarityBadge } from '../shared/RarityBadge';
import { clampRarityTier } from '../../types/rarity';
import { POSSESSION_SUBCATEGORY_NAMES } from '../../types/attachments';
import type { PossessionSubcategory } from '../../types/attachments';
import type { WorldGraph } from '../../engine/graph';

interface ArtifactSheetProps {
  name: string;
  onClose: () => void;
  /** Graph node id — enables the visual and the information block. */
  artifactId?: string;
  graph?: WorldGraph | null;
}

/** Copy shown when the graph holds no prose for this artifact (a designed state, Law 4). */
const NO_DETAIL_COPY = 'Nothing further is recorded of this thing yet.';

/** Resolve the subcategory to its player-facing name, or null when unset/unknown (Law 14). */
function subcategoryName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  return POSSESSION_SUBCATEGORY_NAMES[raw as PossessionSubcategory] ?? null;
}

export const ArtifactSheet = React.memo(function ArtifactSheet({
  name,
  onClose,
  artifactId,
  graph,
}: ArtifactSheetProps) {
  const node = artifactId && graph ? graph.getNode(artifactId) : undefined;
  const props = node?.properties ?? {};

  const kindLine = subcategoryName(props.subcategory);
  const tier = typeof props.tier === 'number' ? clampRarityTier(props.tier) : null;
  const flavor = typeof props.flavorText === 'string' ? props.flavorText : null;
  const tags = Array.isArray(props.tags)
    ? (props.tags as unknown[]).filter((t): t is string => typeof t === 'string')
    : [];

  return (
    <Modal open={true} onClose={onClose} aria-label={`${name} profile`}>
      <Modal.Header onClose={onClose}>{name}</Modal.Header>
      <Modal.Body>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {/* Canonical visual — bespoke plate, else the category plate, else the
              designed glyph tile. All three come from resolveEntityVisual. */}
          {artifactId && (
            <EntityVisual
              size="hero"
              entity={{ id: artifactId, kind: 'artifact', name }}
              graph={graph ?? null}
              data-testid="artifact-sheet-visual"
            />
          )}

          {/* Identity block — kind and standing, in words. */}
          {(kindLine || tier) && (
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
              data-testid="artifact-sheet-identity"
            >
              {tier && <RarityBadge tier={tier} />}
              {kindLine && tier && <span aria-hidden="true">·</span>}
              {kindLine && <span>{kindLine}</span>}
            </div>
          )}

          {/* Information — the item's own prose, or the designed absence line. */}
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              lineHeight: 1.5,
              color: flavor ? 'var(--text-secondary)' : 'var(--text-muted)',
              fontStyle: flavor ? 'normal' : 'italic',
            }}
            data-testid="artifact-sheet-prose"
          >
            {flavor ?? NO_DETAIL_COPY}
          </p>

          {/* Authored tags read as plain words already ("#mount", "#travel"). */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
              {tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-tertiary)',
                    background: 'var(--bg-raised)',
                    borderRadius: '3px',
                    padding: '2px 6px',
                  }}
                >
                  {tag.replace(/^#/, '')}
                </span>
              ))}
            </div>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
});

ArtifactSheet.displayName = 'ArtifactSheet';
