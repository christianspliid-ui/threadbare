/**
 * THR-2098 (rule R3) — relics as art tiles in the aside: the relics lying at a place, and
 * the relics a faction holds. The same gallery The First's carried relics got in slice 1
 * (THR-2097): each tile carries the relic's art (bespoke plate, else its category plate,
 * `getAttachmentArtUrl`) and the ref that opens it (Law 21). Pure reads; no tick work.
 */
import type { CardTile, CardsSection } from '../../../types/detailPage';
import type { GraphNode } from '../../../types/graph';
import type { WorldGraph } from '../../graph';
import { getAttachmentArtUrl } from '../../../data/artifact-category-art';
import { SUBJECT_GALLERY_LABELS } from '../../../data/subject-sheet-words';
import { humanizeKeySegment } from '../../aftermathWords';

/** The relic's kind word, as the page header words it (`subtitleForNode`'s item branch). */
function relicKindWord(node: GraphNode): string {
  const raw = node.properties.category;
  const worded = typeof raw === 'string' ? humanizeKeySegment(raw).replace(/\s+/g, ' ').toLowerCase() : '';
  return worded || 'artifact';
}

function isRelic(node: GraphNode | undefined): node is GraphNode {
  return node != null && (node.type === 'artifact' || node.type === 'artifact_legendary');
}

function sentenceCase(word: string): string {
  return word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

/** One relic as an art tile. No art resolves → the words-only tile (the glyph is the page's). */
export function relicTile(node: GraphNode): CardTile {
  const art = getAttachmentArtUrl(node.id, node.properties.subcategory as string | undefined);
  return {
    ref: { kind: 'artifact', id: node.id, name: node.name },
    ...(art ? { image: { src: art, alt: node.name } } : {}),
    title: node.name,
    kindWord: sentenceCase(relicKindWord(node)),
    lines: [],
  };
}

/**
 * The gallery over these relic ids, id-sorted (NFP #3), the label carrying its count —
 * "Relics here · 3". Ids that are not relics are skipped; none left → null (Law 25).
 */
export function relicGallery(graph: WorldGraph, ids: readonly string[], typeId: string, label: string): CardsSection | null {
  const relics = [...new Set(ids)].sort().map(id => graph.getNode(id)).filter(isRelic);
  if (relics.length === 0) return null;
  return {
    kind: 'cards',
    typeId,
    label: SUBJECT_GALLERY_LABELS.counted.replace('{label}', label).replace('{n}', String(relics.length)),
    gold: false,
    tier: 'routine',
    source: 'relicGallery',
    tiles: relics.map(relicTile),
  };
}
