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
 * **Traits (THR-1521).** A thing can carry a trait the way a mortal or a place can —
 * *Storied* for one that has been where things happened, *Cursed* for one a curse
 * rides in. They are `has_trait` edges on the artifact node, read here through the
 * one reader (`readArtifactTraits`), and shown as chips in the same vocabulary the
 * attachment sheet paints: name, a level in words (never a numeral, Law 13), the
 * polarity as sentiment, and the definition's own hover. The slot appears only when
 * the thing carries one (Law 4 — absence is designed, not a placeholder), and a
 * holding face never shows one because it can never carry one (Law 56 — a chip is
 * backed by a real edge or it is not drawn).
 *
 * **Tags** are chips through the same vocabulary the attachment sheet uses
 * (`contentTagChips`) — the two sheets disagreed on tag rendering until THR-1521.
 *
 * NFP #4 (fail-soft): every field is optional in practice. A node the graph
 * cannot resolve, or one carrying no prose, still renders its visual, its name
 * and a designed "nothing further recorded" line — never a blank body.
 */

import React from 'react';
import { Modal } from '../shared/Modal';
import { EntityVisual } from '../shared/EntityVisual';
import { RarityBadge } from '../shared/RarityBadge';
import { Section } from '../shared/Section';
import { clampRarityTier } from '../../types/rarity';
import { POSSESSION_SUBCATEGORY_NAMES } from '../../types/attachments';
import type { PossessionSubcategory } from '../../types/attachments';
import type { ChipDescriptor, ChipsSection } from '../../types/detailPage';
import type { WorldGraph } from '../../engine/graph';
import { readArtifactTraits } from '../../engine/artifactTraits';
import { ATTACHMENT_TOOLTIP_PREFIX } from '../../engine/attachmentTemplateIndex';
import { contentTagChips } from './contentTagChips';

interface ArtifactSheetProps {
  name: string;
  onClose: () => void;
  /** Graph node id — enables the visual and the information block. */
  artifactId?: string;
  graph?: WorldGraph | null;
  /**
   * The runtime world version (THR-1521). The graph is mutated in place, so this memoised
   * sheet would keep painting the traits it read at open; a trait stamped or climbed
   * while it is open changes this number, and the new prop re-renders the sheet.
   * Read-only — never used for anything but invalidation.
   */
  worldVersion?: number;
}

/** Copy shown when the graph holds no prose for this artifact (a designed state, Law 4). */
const NO_DETAIL_COPY = 'Nothing further is recorded of this thing yet.';

/**
 * The glyph a trait chip leads with. Traits are *state* — good or ill to carry — so
 * they take the polarity axis's glyph rather than a tag axis's (THR-1486 vocabulary).
 */
const TRAIT_CHIP_GLYPH = '●';

/** Resolve the subcategory to its player-facing name, or null when unset/unknown (Law 14). */
function subcategoryName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  return POSSESSION_SUBCATEGORY_NAMES[raw as PossessionSubcategory] ?? null;
}

/** A chips section in the attachment sheet's shape, so both sheets paint one vocabulary. */
function chipsSection(typeId: string, label: string, chips: ChipDescriptor[]): ChipsSection {
  return { kind: 'chips', label, gold: false, tier: 'routine', typeId, source: 'artifact-sheet', chips };
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

  // THR-1521 — the thing's traits, off its own `has_trait` edges. The reader already
  // refuses a holding face and skips a dangling definition, so nothing here invents a
  // row the graph does not hold.
  const traitChips: ChipDescriptor[] = artifactId && graph
    ? readArtifactTraits(graph, artifactId).map(reading => ({
        label: reading.name,
        flavour: reading.levelWord ?? undefined,
        sentiment: reading.polarity,
        tooltipId: `${ATTACHMENT_TOOLTIP_PREFIX}${reading.traitId}`,
        glyph: TRAIT_CHIP_GLYPH,
        dataKey: { attribute: 'artifact-trait', value: reading.traitId },
      }))
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

          {/* Traits — what the thing has become (THR-1521). Only when it carries one. */}
          {traitChips.length > 0 && (
            <div data-testid="artifact-sheet-traits">
              <Section section={chipsSection('artifact-traits', 'Traits', traitChips)} />
            </div>
          )}

          {/* Authored tags, in the attachment sheet's chip vocabulary (THR-1486 / THR-1521). */}
          {tags.length > 0 && (
            <div data-testid="artifact-sheet-tags">
              <Section section={chipsSection('tags', 'Tags', contentTagChips(tags))} />
            </div>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
});

ArtifactSheet.displayName = 'ArtifactSheet';
