/**
 * Revelation Resolver — applies layer revelation mutations from Find actions
 * and hidden site discovery.
 *
 * When a hex-targeting Find action resolves successfully, this module updates
 * the hexRevelation map to mark the appropriate layer as revealed. It also
 * handles hidden sublocation discovery via GraphOp (TB-043).
 *
 * NFP compliance:
 *   #1 Tunability: revelation mapping is data-driven (TEMPLATE_REVELATION_MAP)
 *   #2 Inspectability: LayerRevealedTrace + HiddenSiteRevealedTrace emitted per reveal
 *   #3 Determinism: pure lookup, no randomness
 *   #4 Fail-soft: unknown template → no reveal (not an error); missing hex → creates entry
 */
import type { NarrativeLayer, HexRevelation } from '../types/unifiedAction';
import { createDefaultHexRevelation } from '../types/unifiedAction';
import { hexKey } from '../lib/hexKey';
import { emitTrace } from './traceBuffer';
import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { TickEvent } from '../types/gameState';
import type { NotificationDirective } from '../types/notification';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Maps template IDs to the narrative layer(s) they reveal on success.
 * A single layer or an array of layers may be specified.
 * Templates not in this map produce no revelation effect.
 */
export const TEMPLATE_REVELATION_MAP: Readonly<Record<string, NarrativeLayer | readonly NarrativeLayer[]>> = {
  // Land + People layer (THR-398: Survey unified — reveals both in one cast)
  'hex.survey': ['land', 'people'] as const,

  // Land layer
  'hex.dowse_resources': 'land',

  // Soul layer
  'hex.read_currents': 'soul',     // full detail

  // Ruins layer
  'hex.read_stones': 'ruins',      // full detail — expensive direct divine action
  'hex.whisper_intuition': 'ruins', // partial — through agent encounter
};

// ─── Revelation Mutation ──────────────────────────────────────────────────────

export interface RevelationMutation {
  readonly col: number;
  readonly row: number;
  readonly layer: NarrativeLayer;
  readonly source: string; // template ID that caused the reveal
}

// ─── Resolver ─────────────────────────────────────────────────────────────────

/**
 * Determine what layer(s) (if any) a resolved hex action should reveal.
 *
 * @param templateId The template ID of the resolved action
 * @param col Hex column coordinate
 * @param row Hex row coordinate
 * @param outcome Whether the action succeeded or failed
 * @param tick Current tick for tracing
 * @returns Array of revelation mutations (0 or more items)
 */
export function resolveRevelation(
  templateId: string,
  col: number,
  row: number,
  outcome: 'success' | 'failure',
  tick: number,
): RevelationMutation[] {
  // Only successful actions reveal layers
  if (outcome !== 'success') return [];

  const target = TEMPLATE_REVELATION_MAP[templateId];
  if (!target) return [];

  const layers: readonly NarrativeLayer[] = Array.isArray(target) ? target : [target];

  return layers.map(layer => {
    emitTrace({
      tick,
      category: 'revelation',
      type: 'layer_revealed',
      summary: `Layer '${layer}' revealed at hex (${col},${row}) by ${templateId}`,
      hexCol: col,
      hexRow: row,
      layer,
      layers,
      revealedBy: templateId,
    } as any);

    return { col, row, layer, source: templateId };
  });
}

// ─── Apply Mutations ──────────────────────────────────────────────────────────

/**
 * Apply revelation mutations to the hexRevelation map.
 * Returns a new map (does not mutate input). Idempotent — revealing an
 * already-revealed layer is a no-op.
 *
 * @param current Current hexRevelation map (may be undefined)
 * @param mutations Mutations to apply
 * @returns Updated hexRevelation map
 */
export function applyRevelationMutations(
  current: Record<string, HexRevelation> | undefined,
  mutations: readonly RevelationMutation[],
): Record<string, HexRevelation> {
  if (mutations.length === 0) return current ?? {};

  const result = { ...(current ?? {}) };

  for (const mutation of mutations) {
    const key = hexKey(mutation.col, mutation.row);
    const existing = result[key] ?? createDefaultHexRevelation();

    if (!existing[mutation.layer]) {
      result[key] = { ...existing, [mutation.layer]: true };
    }
  }

  return result;
}

/**
 * Reveal a specific layer on a hex. Convenience wrapper for single reveals
 * (e.g., auto-revealing land when fog of war lifts).
 */
export function revealLayer(
  current: Record<string, HexRevelation> | undefined,
  col: number,
  row: number,
  layer: NarrativeLayer,
): Record<string, HexRevelation> {
  return applyRevelationMutations(current, [{ col, row, layer, source: 'auto' }]);
}

// ─── Hidden Site Discovery (TB-043) ──────────────────────────────────────────

/**
 * Result of a hidden site reveal operation.
 */
export interface HiddenSiteRevealResult {
  readonly sublocationId: string;
  readonly sublocationName: string;
  readonly hexCol: number;
  readonly hexRow: number;
  readonly hasElderMagic: boolean;
}

/**
 * Templates that can reveal hidden sites on success.
 * Maps template ID → true if the template can reveal hidden sublocations.
 * NFP #1 (Tunability): add new Find templates here.
 */
export const HIDDEN_SITE_REVEAL_TEMPLATES: ReadonlySet<string> = new Set([
  'hex.survey',             // Unified survey reveals hidden sites (land + people)
  'hex.explore_ruins',      // Direct ruins exploration
  'hex.divine_sight',       // Divine perception pierces all concealment
  'hex.dowse_resources',    // TB-046: Resource dowsing reveals hidden deposits
  'hex.read_currents',      // TB-046: Full soul reading detects hidden sites
  'hex.read_stones',        // TB-047: Direct divine ruins perception
]);

/**
 * Reveal hidden sublocations at a hex when a qualifying Find action succeeds.
 *
 * Finds all hidden sublocations at the hex (via graph query), flips their
 * `hidden` property to `false`, and emits HiddenSiteRevealedTrace for each.
 *
 * @param graph WorldGraph instance (mutated — hidden flags flipped)
 * @param templateId The template that resolved successfully
 * @param col Hex column coordinate
 * @param row Hex row coordinate
 * @param tick Current tick for tracing
 * @returns Array of reveal results (empty if no hidden sites found or template doesn't reveal)
 */
export function resolveHiddenSiteReveals(
  graph: WorldGraph,
  templateId: string,
  col: number,
  row: number,
  tick: number,
): HiddenSiteRevealResult[] {
  // Only qualifying templates reveal hidden sites
  if (!HIDDEN_SITE_REVEAL_TEMPLATES.has(templateId)) return [];

  // Find all location nodes at this hex
  const locations = graph.getNodesByType('location').filter(node => {
    const props = node.properties;
    return props.hexCol === col && props.hexRow === row;
  });

  const results: HiddenSiteRevealResult[] = [];

  for (const location of locations) {
    // Check sublocations (children via 'contains' edges)
    const containsEdges = graph.getOutgoingEdges(location.id, 'contains');
    for (const edge of containsEdges) {
      const subloc = graph.getNode(edge.target);
      if (!subloc || subloc.type !== 'location') continue;
      if (subloc.properties.hidden !== true) continue;

      // Reveal the hidden site — flip hidden to false
      // updateNode merges properties, so we only need to pass the changed field
      try {
        graph.updateNode(subloc.id, { properties: { hidden: false } });
      } catch {
        // Fail-soft: skip if update fails
        continue;
      }

      const hasElderMagic = subloc.properties.divineOrigin != null
        || subloc.name.toLowerCase().includes('elder');

      const result: HiddenSiteRevealResult = {
        sublocationId: subloc.id,
        sublocationName: subloc.name,
        hexCol: col,
        hexRow: row,
        hasElderMagic,
      };

      // Emit trace (NFP #2: Inspectability)
      emitTrace({
        tick,
        category: 'revelation',
        type: 'hidden_site_revealed',
        summary: `Hidden site '${subloc.name}' revealed at hex (${col},${row}) by ${templateId}`,
        hexCol: col,
        hexRow: row,
        sublocationId: subloc.id,
        sublocationName: subloc.name,
        hasElderMagic,
      } as any);

      results.push(result);
    }
  }

  return results;
}

// ─── Discovery TickEvent Builders ────────────────────────────────────────────

let discoveryEventCounter = 0;
export function resetDiscoveryEventCounter(): void { discoveryEventCounter = 0; }

/**
 * Build a TickEvent for a hidden site discovery.
 * Elder magic sites get an alert with popup; non-elder sites get a toast.
 */
export function buildDiscoveryTickEvent(
  reveal: HiddenSiteRevealResult,
  tick: number,
): TickEvent {
  const isElder = reveal.hasElderMagic;
  const notification: NotificationDirective = isElder
    ? {
        channel: 'alert',
        icon: 'discovery',
        popup: {
          title: 'Elder Magic Uncovered',
          body: `The ancient site "${reveal.sublocationName}" has been revealed. Elder essence flows from forgotten depths.`,
        },
      }
    : {
        channel: 'toast',
        icon: 'discovery',
      };

  return {
    id: `evt_discovery_${++discoveryEventCounter}_${tick}`,
    tick,
    type: isElder ? 'elder_site_discovered' : 'hidden_site_discovered',
    message: isElder
      ? `Ancient elder magic stirs — ${reveal.sublocationName} has been uncovered`
      : `A hidden site has been revealed — ${reveal.sublocationName}`,
    significance: isElder ? 0.9 : 0.6,
    sphere: isElder ? 'spirit' : undefined,
    hexCoords: { col: reveal.hexCol, row: reveal.hexRow },
    notification,
  };
}
