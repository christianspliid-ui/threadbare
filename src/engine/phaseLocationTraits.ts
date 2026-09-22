/**
 * Phase: Location Traits — places earn a trait from what happens to them (THR-790).
 *
 * The first producer of location traits from the world's **own scalars**. Before
 * this phase every `trait.condition.location.*` edge was planted by an encounter
 * aftermath; nothing read a town's long prosperity or a shrine-hill's saturation and
 * said so on the page. Now four rules run over the place tier every tick:
 *
 * | Trait | Enter | Release | Co-condition |
 * |---|---|---|---|
 * | *Welcoming* | prosperity ≥ `LOCATION_TRAIT_WELCOMING_ENTER` | `< …_RELEASE` | — |
 * | *Lawless* | unrest ≥ `LOCATION_TRAIT_LAWLESS_ENTER` | `< …_RELEASE` | — |
 * | *Veil-thin* | saturation ≥ `LOCATION_TRAIT_VEIL_THIN_ENTER` | `< …_RELEASE` | not while *Haunted* |
 * | *Haunted* | saturation ≥ `LOCATION_TRAIT_HAUNTED_ENTER` | `< …_RELEASE` | `deathCount ≥ LOCATION_TRAIT_HAUNTED_DEATHS` |
 *
 * **The hysteresis is the promotion phase's** (`phaseSettlementPromotion.ts:100-124`):
 * a sustain counter persisted on the Location node (`locationTraitSustain.<rule>`)
 * climbs while the scalar sits at or past enter, mints when it reaches
 * `LOCATION_TRAIT_SUSTAIN_TICKS`, **holds** inside the dead band, and resets only
 * below release. Enter and release are exclusive by the band, so a place cannot
 * flicker between minted and released on a scalar that hovers.
 *
 * **A minted trait has no term.** It is a `has_trait` edge with no `ticksRemaining`;
 * the release rule is what removes it, so `decayConditions` never touches it and the
 * page's term column reads "until it lifts". *Haunted* supersedes *Veil-thin* on the
 * same place — the stronger word wins and the weaker is released with a
 * `superseded` record — so the page never shows both.
 *
 * **Place tier only.** Locations are enumerated with `getLocationNodes`, never a bare
 * `getNodesByType('location')`, which since THR-1183 returns Places too. The step
 * reader hops a Place to its parent Location; movement and target gating read the
 * node they are given — so the place tier is the one source every reader agrees on,
 * and minting on a Place would double-count for one reader and vanish for two.
 *
 * Fail-soft (NFP #4): a scalar the writers never set skips its rule for that
 * location; a definition node missing from the graph (a world saved before this
 * phase) skips the mint and is counted, never thrown; a prosperity written on the
 * 0–1 scale reads below every threshold, which for a monster den or a ruin is right.
 *
 * Inspectability (NFP #2): one aggregate `location_trait` trace per tick in which
 * anything moved, listing every mint with its input and value, every release, every
 * supersession; a chronicle line at `LOCATION_TRAIT_EVENT_SIGNIFICANCE` on mint and
 * none on release (a place quietly returning to itself is not an event — Law 13
 * parity); `window.__DEBUG.getLocationTraits` and the CLI `traits` command read the
 * same edges through {@link describeLocationTraits}.
 *
 * Determinism (NFP #3): thresholds over persisted counters; no draw.
 *
 * Plan: Docs/plans/2026-09-21-thr-790-traits-wave-2.md.
 */
import type { GameState, TickEvent } from '../types/gameState';
import type { GraphNode } from '../types/graph';
import type { WorldGraph } from './graph';
import type { LocationTraitTrace } from '../types/trace';
import { emitTrace } from './traceBuffer';
import { assignTrait, removeTrait } from './traits';
import { getLocationNodes } from './sublocationShape';
import { touchWorld, type SimulationRuntime } from './simulationRuntime';
import {
  LOCATION_TRAIT_IDS,
  LOCATION_TRAIT_SUSTAIN_TICKS,
  LOCATION_TRAIT_WELCOMING_ENTER,
  LOCATION_TRAIT_WELCOMING_RELEASE,
  LOCATION_TRAIT_LAWLESS_ENTER,
  LOCATION_TRAIT_LAWLESS_RELEASE,
  LOCATION_TRAIT_VEIL_THIN_ENTER,
  LOCATION_TRAIT_VEIL_THIN_RELEASE,
  LOCATION_TRAIT_HAUNTED_ENTER,
  LOCATION_TRAIT_HAUNTED_RELEASE,
  LOCATION_TRAIT_HAUNTED_DEATHS,
  LOCATION_TRAIT_EVENT_SIGNIFICANCE,
  type LocationTraitInput,
  type LocationTraitRuleId,
} from '../data/location-trait-constants';
import { LOCATION_CONDITION_ID_PREFIX } from '../data/condition-trait-content';

// ─── The rules ──────────────────────────────────────────────────────────────

/** What `assignTrait` records as the edge's `source` for a phase-minted trait. */
export const LOCATION_TRAIT_SOURCE = 'phaseLocationTraits';

/** Property-name prefix for the per-rule sustain counters on a Location node. */
export const LOCATION_TRAIT_SUSTAIN_PROPERTY_PREFIX = 'locationTraitSustain.';

interface LocationTraitRule {
  readonly id: LocationTraitRuleId;
  readonly traitId: string;
  readonly input: LocationTraitInput;
  readonly enter: number;
  readonly release: number;
  /** Extra condition the place must meet to *enter*; release ignores it. */
  readonly coCondition?: (loc: GraphNode) => boolean;
  /** A trait whose presence on the place blocks this rule from minting. */
  readonly supersededBy?: string;
}

const SCALAR_PROPERTY: Readonly<Record<LocationTraitInput, string>> = {
  prosperity: 'prosperity',
  unrest: 'unrest',
  saturation: 'magicalSaturation',
};

function readNumber(loc: GraphNode, key: string): number | null {
  const v = loc.properties?.[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/**
 * The four rules, in evaluation order. *Haunted* runs before *Veil-thin* so a place
 * that qualifies for both mints the stronger word in the tick it qualifies and the
 * weaker never appears beside it.
 */
export const LOCATION_TRAIT_RULES: readonly LocationTraitRule[] = [
  {
    id: 'welcoming',
    traitId: LOCATION_TRAIT_IDS.welcoming,
    input: 'prosperity',
    enter: LOCATION_TRAIT_WELCOMING_ENTER,
    release: LOCATION_TRAIT_WELCOMING_RELEASE,
  },
  {
    id: 'lawless',
    traitId: LOCATION_TRAIT_IDS.lawless,
    input: 'unrest',
    enter: LOCATION_TRAIT_LAWLESS_ENTER,
    release: LOCATION_TRAIT_LAWLESS_RELEASE,
  },
  {
    id: 'haunted',
    traitId: LOCATION_TRAIT_IDS.haunted,
    input: 'saturation',
    enter: LOCATION_TRAIT_HAUNTED_ENTER,
    release: LOCATION_TRAIT_HAUNTED_RELEASE,
    coCondition: loc => (readNumber(loc, 'deathCount') ?? 0) >= LOCATION_TRAIT_HAUNTED_DEATHS,
  },
  {
    id: 'veilThin',
    traitId: LOCATION_TRAIT_IDS.veilThin,
    input: 'saturation',
    enter: LOCATION_TRAIT_VEIL_THIN_ENTER,
    release: LOCATION_TRAIT_VEIL_THIN_RELEASE,
    supersededBy: LOCATION_TRAIT_IDS.haunted,
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function hasTrait(graph: WorldGraph, locationId: string, traitId: string): boolean {
  return graph.getOutgoingEdges(locationId, 'has_trait').some(e => e.target === traitId);
}

function sustainKey(rule: LocationTraitRuleId): string {
  return `${LOCATION_TRAIT_SUSTAIN_PROPERTY_PREFIX}${rule}`;
}

/** The word the chronicle line uses — the definition's display name, never the id (Law 14). */
function traitWord(graph: WorldGraph, traitId: string): string {
  return graph.getNode(traitId)?.name ?? traitId.slice(LOCATION_CONDITION_ID_PREFIX.length);
}

// ─── Phase function ─────────────────────────────────────────────────────────

/**
 * phaseLocationTraits — run the four minting rules over every place-tier Location.
 *
 * Called once per tick, after magical saturation (so every input is this tick's).
 * Mutates graph node properties and `has_trait` edges in place; returns the tick
 * events it wrote, or `{}` when nothing moved.
 */
export function phaseLocationTraits(state: GameState, runtime?: SimulationRuntime): Partial<GameState> {
  const { graph, tick } = state;
  // Typed off the registered trace shape so the emit below cannot drift from it.
  const minted: LocationTraitTrace['minted'][number][] = [];
  const released: LocationTraitTrace['released'][number][] = [];
  const superseded: LocationTraitTrace['superseded'][number][] = [];
  const events: TickEvent[] = [];
  let skippedMissingDefinition = 0;

  for (const loc of getLocationNodes(graph)) {
    for (const rule of LOCATION_TRAIT_RULES) {
      const value = readNumber(loc, SCALAR_PROPERTY[rule.input]);
      // Fail-soft: a scalar the writers never set skips the rule — no counter written.
      if (value === null) continue;

      const key = sustainKey(rule.id);
      const held = hasTrait(graph, loc.id, rule.traitId);

      if (held) {
        if (value < rule.release) {
          removeTrait(graph, loc.id, rule.traitId);
          loc.properties[key] = 0;
          released.push({ locationId: loc.id, traitId: rule.traitId, value });
        }
        // At or above release: the trait stays, whatever the counter says.
        continue;
      }

      // Not held. The blocked rule (veil-thin under haunted) neither climbs nor mints.
      if (rule.supersededBy && hasTrait(graph, loc.id, rule.supersededBy)) {
        loc.properties[key] = 0;
        continue;
      }

      let counter = readNumber(loc, key) ?? 0;
      const qualifies = value >= rule.enter && (rule.coCondition?.(loc) ?? true);

      if (qualifies) {
        counter += 1;
      } else if (value < rule.release) {
        // Below the band: the run is over. A one-tick dip *inside* the band is not.
        counter = 0;
      }
      // Mid-band (release ≤ value < enter, or enter met without the co-condition):
      // the counter holds — the promotion phase's rule, kept on purpose.

      if (counter >= LOCATION_TRAIT_SUSTAIN_TICKS) {
        if (!graph.getNode(rule.traitId)) {
          // A world saved before this phase, or a definition that stopped shipping.
          // `seedEncounterTraitDefinitions` re-seeds on load; until then, count and
          // hold the counter at the threshold rather than throw from the tick loop.
          skippedMissingDefinition += 1;
          loc.properties[key] = LOCATION_TRAIT_SUSTAIN_TICKS;
          continue;
        }
        assignTrait(graph, loc.id, rule.traitId, { tick, source: LOCATION_TRAIT_SOURCE });
        loc.properties[key] = 0;
        minted.push({
          locationId: loc.id,
          traitId: rule.traitId,
          input: rule.input,
          value,
          sustainTicks: LOCATION_TRAIT_SUSTAIN_TICKS,
        });
        events.push({
          id: `evt_location_trait_${loc.id}_${rule.id}_${tick}`,
          tick,
          type: 'narrative',
          message: `${loc.name} has become ${traitWord(graph, rule.traitId)}.`,
          significance: LOCATION_TRAIT_EVENT_SIGNIFICANCE,
          hexCoords:
            typeof loc.properties?.hexCol === 'number' && typeof loc.properties?.hexRow === 'number'
              ? { col: loc.properties.hexCol as number, row: loc.properties.hexRow as number }
              : undefined,
        });

        // Supersession: the stronger word arrives and the weaker one goes.
        for (const weaker of LOCATION_TRAIT_RULES) {
          if (weaker.supersededBy === rule.traitId && hasTrait(graph, loc.id, weaker.traitId)) {
            removeTrait(graph, loc.id, weaker.traitId);
            loc.properties[sustainKey(weaker.id)] = 0;
            superseded.push({ locationId: loc.id, removed: weaker.traitId, by: rule.traitId });
          }
        }
      } else {
        loc.properties[key] = counter;
      }
    }
  }

  const moved = minted.length + released.length + superseded.length;
  if (moved > 0) {
    // `assignTrait` / `removeTrait` do not bump the world version; a selector keyed on
    // `worldVersion` would serve a stale page without this.
    if (runtime) touchWorld(runtime);

    emitTrace({
      category: 'location_trait',
      tick,
      summary:
        `location traits: ${minted.length} minted, ${released.length} released, `
        + `${superseded.length} superseded`
        + (skippedMissingDefinition > 0 ? `, ${skippedMissingDefinition} skipped (definition missing)` : ''),
      minted,
      released,
      superseded,
      skippedMissingDefinition,
    });
  }

  return events.length > 0 ? { tickEvents: [...state.tickEvents, ...events] } : {};
}

// ─── Readout (debug bridge + CLI) ───────────────────────────────────────────

/** One location-trait edge as the debug bridge and the CLI report it. */
export interface LocationTraitReadout {
  readonly locationId: string;
  readonly locationName: string;
  readonly traitId: string;
  /** The definition's display name, or the id when the definition is missing. */
  readonly traitName: string;
  /** The tick the edge was written, or null when the edge carries none. */
  readonly since: number | null;
  /** `phaseLocationTraits` for a minted trait; the aftermath's source otherwise. */
  readonly source: string | null;
  /** Remaining term for an aftermath-planted condition; null for a minted trait. */
  readonly ticksRemaining: number | null;
  /** The four sustain counters on the place, as they stand this tick. */
  readonly sustain: Readonly<Record<LocationTraitRuleId, number>>;
}

/**
 * Every location condition on every place-tier Location — or one place's, matched
 * by id, id prefix, or partial name (case-insensitive). Reads the same `has_trait`
 * edges the page and the three readers read, so it cannot disagree with them.
 * Empty when nothing matches.
 */
export function describeLocationTraits(graph: WorldGraph, query?: string): LocationTraitReadout[] {
  const lowered = query?.toLowerCase();
  const out: LocationTraitReadout[] = [];
  for (const loc of getLocationNodes(graph)) {
    if (lowered) {
      const matches =
        loc.id === query
        || loc.id.startsWith(query!)
        || (loc.name ?? '').toLowerCase().includes(lowered);
      if (!matches) continue;
    }
    const sustain = Object.fromEntries(
      LOCATION_TRAIT_RULES.map(r => [r.id, readNumber(loc, sustainKey(r.id)) ?? 0]),
    ) as Record<LocationTraitRuleId, number>;
    for (const edge of graph.getOutgoingEdges(loc.id, 'has_trait')) {
      if (!edge.target.startsWith(LOCATION_CONDITION_ID_PREFIX)) continue;
      const acquired = edge.properties?.acquiredTick;
      const remaining = edge.properties?.ticksRemaining;
      out.push({
        locationId: loc.id,
        locationName: loc.name ?? loc.id,
        traitId: edge.target,
        traitName: graph.getNode(edge.target)?.name ?? edge.target,
        since: typeof acquired === 'number' ? acquired : null,
        source: typeof edge.properties?.source === 'string' ? (edge.properties.source as string) : null,
        ticksRemaining: typeof remaining === 'number' ? remaining : null,
        sustain,
      });
    }
  }
  return out;
}
