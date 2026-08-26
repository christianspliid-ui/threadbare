/**
 * Ambition Tick Processor — periodic milestone checking and re-evaluation.
 *
 * Runs every MILESTONE_CHECK_INTERVAL ticks to check active ambitions for
 * milestone completion, full completion, and abandonment. Runs re-evaluation
 * of empty ambition slots every AMBITION_REEVAL_INTERVAL ticks.
 */
import type { GameState, TickEvent } from '../types/gameState';
import type { ActiveAmbition, AmbitionPriority } from '../types/ambition';
import type { ReachDomain } from '../types/traits';
import type { SphereName } from '../types/index';
import type { WorldGraph } from './graph';
import { evaluateAmbitionProgress } from './ambitionLifecycle';
import { assignInitialAmbitions } from './ambitionAssignment';
import {
  AMBITION_TEMPLATES,
  EVENT_MINTED_AMBITION_TEMPLATES,
  findAmbitionTemplateById,
} from '../data/ambition-templates';
import {
  AMBITION_MINTING_RULES,
  MINT_CLASS_LABELS,
  classifyMintEvent,
  type MintEventClass,
  type MintRelation,
} from '../data/ambition-minting-rules';
import { emitTrace } from './traceBuffer';
import type { AmbitionMintedTrace } from '../types/trace';
import { selectAmbitions, type AmbitionAgentSnapshot } from './ambitionSelection';
import { collectGrantedTraits, GRANTED_TRAIT_EFFECTIVE_LEVEL } from './effects/effectQueries';
import { collectBearerTraitRefs } from './traitRefIndex';
import { observeResidence, type ResidenceObservation } from './agentResidence';
import type { AgentResidenceTrace } from '../types/trace';
import {
  AMBITION_KIND_KEY,
  AMBITION_KIND_TEMPLATE,
  getAmbitionKind,
  getAmbitionTemplateId,
  traceUnevaluableAmbition,
} from './ambitionShape';

// ─── Tunable Constants ───────────────────────────────────────────

/** Check milestones every N ticks */
export const MILESTONE_CHECK_INTERVAL = 15;

/** Re-evaluate empty ambition slots every N ticks */
export const AMBITION_REEVAL_INTERVAL = 25;

// ─── World-Minted Ambition Constants (THR-726) ───────────────────

/** Event window scanned at each re-eval (matches AMBITION_REEVAL_INTERVAL). */
export const MINT_LOOKBACK_TICKS = 25;

/** Cap on agents minting from one event — a razed town makes a handful, not fifty. */
export const MINT_MAX_PER_EVENT = 4;

/** Chance a qualifying candidate is offered into the personality funnel. */
export const MINT_BASE_CHANCE = 0.6;

/** Distinct PRNG stream offset so minting rolls don't shadow spontaneous re-eval. */
export const MINT_SEED_OFFSET = 7919;

/** Cap on sampled agent ids carried in the aggregate mint trace. */
export const MINT_TRACE_SAMPLE_CAP = 8;

// ─── ID Generation ───────────────────────────────────────────────

let ambitionEventCounter = 0;

/**
 * Mint a TickEvent id for an ambition event.
 *
 * **The tick is load-bearing, not decoration (THR-853).** The counter is reset
 * every tick by `orchestrator.resetEventCounters()` so the same seed replays the
 * same ids (NFP #3), which means the counter alone is only unique *within* a
 * tick. Events outlive their tick — `recentEvents` is a 100-entry rolling buffer
 * spanning many — so a tick-less `amb_evt_N` collides with the previous tick's
 * Nth ambition event, and React renders duplicate keys ("children may be
 * duplicated and/or omitted"). Measured: `amb_evt_17` minted 9× in one 260-tick
 * run. Every sibling minter that gets this right encodes the tick the same way
 * (`evt_${tick}_${n}` in the orchestrator, `faction_join_${tick}_${n}` in
 * factionOutcome); these three were the ones that did not.
 */
function nextAmbitionEventId(tick: number): string {
  return `amb_evt_${tick}_${++ambitionEventCounter}`;
}

/** Reset per-tick ambition event counter. Called by orchestrator.resetEventCounters(). */
export function resetAmbitionEventCounter(): void {
  ambitionEventCounter = 0;
}

// ─── Shared Agent-Snapshot Helpers ───────────────────────────────

/**
 * Build the read-only agent snapshot the selection funnel consumes. Shared by
 * spontaneous re-eval and world-event minting so both funnel identically.
 */
export function buildAmbitionAgentSnapshot(
  graph: WorldGraph,
  actorId: string,
): AmbitionAgentSnapshot {
  const actor = graph.getNode(actorId);
  const caps = (actor?.properties.domainCapabilities as Record<ReachDomain, number>)
    ?? ({} as Record<ReachDomain, number>);

  // Traits (THR-786): every ref form of every trait held — canonical node id, short
  // id, display name, tags — so culture-trait ids match too. Item-granted traits
  // (THR-737) are unioned in: an artifact granting `master_smith` makes its bearer
  // eligible for the master_smith-gated ambition, the same as owning the trait.
  //
  // Stays a `string[]` because `AmbitionAgentSnapshot.traits` is a serializable
  // membership list that `passesEligibility` tests with `includes()`; only its
  // contents are now produced by the shared walk rather than an inline copy of it.
  const traits: string[] = [
    ...collectBearerTraitRefs(graph, actorId, {
      grantedTraits: collectGrantedTraits(graph, actorId),
      grantedLevel: GRANTED_TRAIT_EFFECTIVE_LEVEL,
    }).keys(),
  ];

  const culturalSpheres: SphereName[] = [];
  for (const ce of graph.getOutgoingEdges(actorId, 'belongs_to')) {
    const spheres = graph.getNode(ce.target)?.properties.spheres as SphereName[] | undefined;
    if (spheres) culturalSpheres.push(...spheres);
  }

  const bonds = graph.getOutgoingEdges(actorId, 'relates_to').map(e => ({
    bondType: (e.properties.basis as string) ?? 'unknown',
  }));

  return { domainCapabilities: caps, traits, culturalSpheres, bonds };
}

/** Template ids the agent already pursues (active or resolved) — never re-mint. */
function getPursuedTemplateIds(graph: WorldGraph, actorId: string): Set<string> {
  const ids = new Set<string>();
  for (const e of graph.getOutgoingEdges(actorId, 'pursues')) {
    const node = graph.getNode(e.target);
    const tid = node?.properties.templateId as string | undefined;
    if (tid) ids.add(tid);
  }
  return ids;
}

// ─── World-Minted Ambitions (THR-726) ────────────────────────────

/** Small seeded PRNG (mulberry32) — determinism per NFP #3. */
function mintRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One event the agent can mint a want from, already classified. */
interface MintTuple {
  eventId: string;
  eventClass: MintEventClass;
  relation: MintRelation;
  locationName?: string;
}

/** The single ambition a minting pass produced for one agent. */
export interface MintedAmbition {
  templateId: string;
  mintedByEventId: string;
  mintedByLabel: string;
  eventClass: MintEventClass;
}

/** Name of the location an event occurred at, for provenance prose. */
function eventLocationName(graph: WorldGraph, eventId: string): string | undefined {
  const occ = graph.getOutgoingEdges(eventId, 'occurred_at');
  const locId = occ[0]?.target;
  return locId ? graph.getNode(locId)?.name : undefined;
}

/** Compose the receipt-facing provenance label — no digits, reads aloud. */
function composeMintLabel(eventClass: MintEventClass, locationName?: string): string {
  const stem = MINT_CLASS_LABELS[eventClass];
  return locationName ? `${stem} at ${locationName}` : stem;
}

/**
 * Collect qualifying `event` nodes within the lookback window: ones the agent
 * participated in (victim / participant) and ones that merely occurred at their
 * location (witness). Only `encounter_outcome` nodes are graph-durable and
 * classifiable; everything else is inert (fail-soft).
 */
function gatherMintTuples(
  graph: WorldGraph,
  actorId: string,
  tick: number,
): MintTuple[] {
  const out: MintTuple[] = [];
  const seen = new Set<string>();
  const minTick = tick - MINT_LOOKBACK_TICKS;

  const inWindow = (ev: { properties: Record<string, unknown> }): boolean => {
    const evTick = ev.properties.tick;
    return typeof evTick === 'number' && evTick >= minTick && evTick <= tick;
  };

  // Direct participation — role decides victim vs participant.
  for (const e of graph.getOutgoingEdges(actorId, 'participated_in')) {
    const ev = graph.getNode(e.target);
    if (!ev || ev.properties.eventType !== 'encounter_outcome' || !inWindow(ev)) continue;
    const cls = classifyMintEvent(ev.properties.reachTested as string | undefined);
    if (!cls) continue;
    const relation: MintRelation = (e.properties.role as string) === 'target' ? 'victim' : 'participant';
    out.push({ eventId: ev.id, eventClass: cls, relation, locationName: eventLocationName(graph, ev.id) });
    seen.add(ev.id);
  }

  // Witnessed at the agent's current location (not already counted).
  const locId = graph.getOutgoingEdges(actorId, 'located_at')[0]?.target;
  if (locId) {
    for (const oe of graph.getIncomingEdges(locId, 'occurred_at')) {
      const ev = graph.getNode(oe.source);
      if (!ev || seen.has(ev.id)) continue;
      if (ev.properties.eventType !== 'encounter_outcome' || !inWindow(ev)) continue;
      const cls = classifyMintEvent(ev.properties.reachTested as string | undefined);
      if (!cls) continue;
      out.push({ eventId: ev.id, eventClass: cls, relation: 'witness', locationName: eventLocationName(graph, ev.id) });
      seen.add(ev.id);
    }
  }

  return out;
}

/**
 * Mint at most one ambition for an agent from recent world events (THR-726).
 * Supplies candidates from `AMBITION_MINTING_RULES`; the existing `selectAmbitions`
 * personality funnel decides which (a craven agent flees where a proud one avenges).
 * Pure — reads graph + snapshot, returns the winning assignment or null. The caller
 * writes the edge and records the per-event cap.
 */
export function mintAmbitionsFromEvents(
  graph: WorldGraph,
  actorId: string,
  tick: number,
  seed: number,
  snapshot: AmbitionAgentSnapshot,
  existingTemplateIds: ReadonlySet<string>,
  perEventMintCount: ReadonlyMap<string, number>,
): MintedAmbition | null {
  const tuples = gatherMintTuples(graph, actorId, tick);
  if (tuples.length === 0) return null;

  // Expand (class × relation) rules into candidates, dropping already-pursued
  // templates and events already at their per-event cap.
  interface Candidate { templateId: string; weight: number; eventId: string; eventClass: MintEventClass; label: string; }
  const candidates: Candidate[] = [];
  for (const t of tuples) {
    if ((perEventMintCount.get(t.eventId) ?? 0) >= MINT_MAX_PER_EVENT) continue;
    const entries = AMBITION_MINTING_RULES[t.eventClass][t.relation];
    if (!entries) continue;
    for (const entry of entries) {
      if (existingTemplateIds.has(entry.templateId)) continue;
      candidates.push({
        templateId: entry.templateId,
        weight: entry.weight,
        eventId: t.eventId,
        eventClass: t.eventClass,
        label: composeMintLabel(t.eventClass, t.locationName),
      });
    }
  }
  if (candidates.length === 0) return null;

  // Base-chance gate (seeded, deterministic).
  const rng = mintRng(seed);
  if (rng() >= MINT_BASE_CHANCE) return null;

  // Personality funnel over the unique candidate templates.
  const candidateTemplateIds = new Set(candidates.map(c => c.templateId));
  const candidateTemplates = EVENT_MINTED_AMBITION_TEMPLATES.filter(t => candidateTemplateIds.has(t.id));
  const selections = selectAmbitions(candidateTemplates, snapshot, {
    maxAmbitions: candidateTemplates.length,
    threshold: 0,
    seed: seed + 1,
  });
  if (selections.length === 0) return null;

  const winnerId = selections[0].templateId;
  // Attach provenance from the highest-weight source event for the winning theme.
  const source = candidates
    .filter(c => c.templateId === winnerId)
    .sort((a, b) => b.weight - a.weight)[0];
  if (!source) return null;

  return {
    templateId: winnerId,
    mintedByEventId: source.eventId,
    mintedByLabel: source.label,
    eventClass: source.eventClass,
  };
}

// ─── Main Phase Function ─────────────────────────────────────────

export function phaseAmbitionProgress(state: GameState): Partial<GameState> {
  // Only run on milestone check intervals
  if (state.tick % MILESTONE_CHECK_INTERVAL !== 0) {
    return {};
  }

  const { graph, tick } = state;
  const newEvents: TickEvent[] = [];

  // World-minted ambition accumulators — ONE aggregate trace per tick (THR-726).
  let mintedCount = 0;
  const mintedByEventClass: Record<string, number> = {};
  const mintedSampleAgentIds: string[] = [];
  // Cross-agent per-event cap: one razed town mints for a handful, not everyone.
  const perEventMintCount = new Map<string, number>();

  // Residence accumulators — ONE aggregate trace per tick, never per-agent (THR-822).
  const residenceCounts: Record<ResidenceObservation, number> = {
    'first-sighting': 0, moved: 0, unchanged: 0, 'no-position': 0,
  };

  // Get all individual actors
  const actors = graph.getNodesByType('actor').filter(
    n => n.properties.actorType === 'individual',
  );

  for (const actor of actors) {
    const actorLabel = actor.name || actor.id;

    // ── Observe residence (THR-822) ──
    //
    // Rides this existing all-actor walk rather than adding a phase: one indexed
    // adjacency lookup per actor per interval, no new traversal (NFP #7). Runs *before*
    // the ambition evaluation below so a settledness condition reads this tick's
    // position, not last interval's. `actor` is a stale handle afterwards — the loop
    // re-reads through `graph`/`actor.id`, never through `actor.properties`.
    residenceCounts[observeResidence(graph, actor.id, tick)]++;

    // Get active pursues edges
    const pursuesEdges = graph.getOutgoingEdges(actor.id, 'pursues');
    const activeEdges = pursuesEdges.filter(
      e => (e.properties.status as string) === 'active',
    );

    // ── Evaluate each active ambition ──
    for (const edge of activeEdges) {
      const ambitionNode = graph.getNode(edge.target);
      // No tripwire on this branch: `addEdge` refuses a dangling target and
      // `removeNode` cascades its incident edges, so a `pursues` edge pointing at a
      // node that is not in the graph is unreachable through the graph API. A trace
      // here could never fire, and an instrument that cannot fire is not evidence.
      if (!ambitionNode) continue; // fail-soft

      // THR-1285: ask the shape module, not `properties.templateId` directly. A
      // faction-vocabulary ambition has no template and never should — reaching one
      // from an *individual* actor means the wrong vocabulary crossed over, which is
      // a different fault from a corrupt template ambition. The skip stays fail-soft
      // either way (NFP #4); the trace is what makes the class visible (NFP #2).
      const kind = getAmbitionKind(ambitionNode);
      if (kind !== AMBITION_KIND_TEMPLATE) {
        traceUnevaluableAmbition(
          tick, actor.id, actorLabel, ambitionNode.id,
          kind === 'unknown' ? 'unclassifiable_ambition' : 'faction_kind_ambition',
        );
        continue; // fail-soft
      }

      const templateId = getAmbitionTemplateId(ambitionNode);
      if (!templateId) {
        traceUnevaluableAmbition(tick, actor.id, actorLabel, ambitionNode.id, 'missing_template_id');
        continue; // fail-soft
      }

      // Resolve across all pools so minted-ambition milestones are evaluated too.
      const template = findAmbitionTemplateById(templateId);
      if (!template) {
        traceUnevaluableAmbition(
          tick, actor.id, actorLabel, ambitionNode.id, 'template_not_found', templateId,
        );
        continue; // fail-soft
      }

      // Build ActiveAmbition from edge properties
      const active: ActiveAmbition = {
        templateId,
        priority: (edge.properties.priority as ActiveAmbition['priority']) ?? 'secondary',
        status: 'active',
        assignedTick: (edge.properties.assignedTick as number) ?? 0,
        completedMilestones: (edge.properties.completedMilestones as string[]) ?? [],
      };

      // `tick` supplies the clock durational conditions need; `active.assignedTick`
      // becomes their measurement window inside `evaluateAmbitionProgress` (THR-822).
      const result = evaluateAmbitionProgress(template, active, graph, actor.id, tick);

      // ── Status changed: completion or abandonment ──
      if (result.status !== 'active') {
        graph.updateEdge(edge.id, {
          properties: {
            ...edge.properties,
            status: result.status,
            completedMilestones: [...result.allCompletedMilestones],
            resolvedTick: tick,
          },
        });

        const eventType = result.status === 'completed'
          ? 'ambition_completed'
          : 'ambition_abandoned';

        const prose = result.status === 'completed'
          ? template.completionProse[0] ?? `${actor.name} completed: ${template.displayName}`
          : template.abandonmentProse[0] ?? `${actor.name} abandoned: ${template.displayName}`;

        newEvents.push({
          id: nextAmbitionEventId(tick),
          tick,
          type: eventType,
          message: prose,
          significance: result.status === 'completed' ? 0.8 : 0.5,
          actorId: actor.id,
          notification: result.status === 'completed'
            ? { channel: 'alert', icon: 'discovery' }
            : { channel: 'alert', icon: 'dilemma' },
        });

        emitTrace({
          tick,
          category: 'ambition_progress',
          summary: `${actorLabel} ${result.status} ambition ${template.displayName}`,
          actorId: actor.id,
          templateId,
          result: result.status,
          milestones: result.allCompletedMilestones,
        });

        continue; // Don't check milestones for resolved ambitions
      }

      // ── New milestones completed (still active) ──
      if (result.newMilestones.length > 0) {
        graph.updateEdge(edge.id, {
          properties: {
            ...edge.properties,
            completedMilestones: [...result.allCompletedMilestones],
          },
        });

        for (const milestoneId of result.newMilestones) {
          const milestone = template.milestones.find(m => m.id === milestoneId);
          const prose = milestone?.prose[0]
            ?? `${actor.name} progressed toward: ${template.displayName}`;

          newEvents.push({
            id: nextAmbitionEventId(tick),
            tick,
            type: 'ambition_milestone',
            message: prose,
            significance: 0.6,
            actorId: actor.id,
            notification: { channel: 'toast' },
          });

          emitTrace({
            tick,
            category: 'ambition_progress',
            summary: `${actorLabel} reached milestone ${milestoneId} for ${template.displayName}`,
            actorId: actor.id,
            templateId,
            result: 'milestone',
            milestoneId,
          });
        }
      }
    }

    // ── Re-evaluation of empty slots ──
    if (tick % AMBITION_REEVAL_INTERVAL === 0) {
      // Shared inputs for both minting and spontaneous re-eval.
      const agentSnapshot = buildAmbitionAgentSnapshot(graph, actor.id);
      const existingTemplateIds = getPursuedTemplateIds(graph, actor.id);

      let currentActiveCount = graph.getOutgoingEdges(actor.id, 'pursues')
        .filter(e => (e.properties.status as string) === 'active')
        .length;

      // ── World-minted ambitions (THR-726): events write desire into free slots
      //    BEFORE spontaneous drift, so a razed hometown mints avengers/refugees. ──
      if (currentActiveCount < 2) {
        const mintSeed = state.seed + tick + actor.id.length + MINT_SEED_OFFSET;
        const minted = mintAmbitionsFromEvents(
          graph, actor.id, tick, mintSeed, agentSnapshot, existingTemplateIds, perEventMintCount,
        );
        if (minted) {
          const tmpl = findAmbitionTemplateById(minted.templateId);
          const ambitionNodeId = `ambition.${minted.templateId}`;
          if (!graph.getNode(ambitionNodeId)) {
            graph.addNode({
              id: ambitionNodeId,
              type: 'ambition',
              name: tmpl?.displayName ?? minted.templateId,
              properties: {
                [AMBITION_KIND_KEY]: AMBITION_KIND_TEMPLATE,
                templateId: minted.templateId,
                displayName: tmpl?.displayName ?? minted.templateId,
                category: tmpl?.category ?? 'survival',
                reachAffinity: tmpl?.reachAffinity ?? {},
                totalMilestones: tmpl?.milestones.length ?? 0,
              },
            });
          }
          const priority: AmbitionPriority = currentActiveCount === 0 ? 'primary' : 'secondary';
          graph.addEdge({
            id: `pursues_${actor.id}_${ambitionNodeId}`,
            source: actor.id,
            target: ambitionNodeId,
            type: 'pursues',
            properties: {
              priority,
              status: 'active',
              assignedTick: tick,
              completedMilestones: [],
              mintedByEventId: minted.mintedByEventId,
              mintedByLabel: minted.mintedByLabel,
            },
          });

          // Minting is silent (desire is interior) — no tickEvent; aggregate trace only.
          mintedCount++;
          mintedByEventClass[minted.eventClass] = (mintedByEventClass[minted.eventClass] ?? 0) + 1;
          if (mintedSampleAgentIds.length < MINT_TRACE_SAMPLE_CAP) mintedSampleAgentIds.push(actor.id);
          perEventMintCount.set(minted.mintedByEventId, (perEventMintCount.get(minted.mintedByEventId) ?? 0) + 1);
          existingTemplateIds.add(minted.templateId);
          currentActiveCount++;
        }
      }

      if (currentActiveCount < 2) {
        const availableTemplates = AMBITION_TEMPLATES.filter(
          t => !existingTemplateIds.has(t.id),
        );

        if (availableTemplates.length > 0) {
          const slotsNeeded = 2 - currentActiveCount;
          const seed = state.seed + tick + actor.id.length;
          const assignments = assignInitialAmbitions(availableTemplates, agentSnapshot, seed);

          for (const assignment of assignments.slice(0, slotsNeeded)) {
            // Find or create shared ambition template node
            const ambitionNodeId = `ambition.${assignment.templateId}`;
            if (!graph.getNode(ambitionNodeId)) {
              const tmpl = AMBITION_TEMPLATES.find(t => t.id === assignment.templateId);
              graph.addNode({
                id: ambitionNodeId,
                type: 'ambition',
                name: tmpl?.displayName ?? assignment.templateId,
                properties: {
                  [AMBITION_KIND_KEY]: AMBITION_KIND_TEMPLATE,
                  templateId: assignment.templateId,
                  displayName: tmpl?.displayName ?? assignment.templateId,
                  category: tmpl?.category ?? 'survival',
                  reachAffinity: tmpl?.reachAffinity ?? {},
                  totalMilestones: tmpl?.milestones.length ?? 0,
                },
              });
            }

            // Create pursues edge
            const edgeId = `pursues_${actor.id}_${ambitionNodeId}`;
            graph.addEdge({
              id: edgeId,
              source: actor.id,
              target: ambitionNodeId,
              type: 'pursues',
              properties: {
                priority: assignment.priority,
                status: 'active',
                assignedTick: tick,
                completedMilestones: [],
              },
            });

            const template = AMBITION_TEMPLATES.find(t => t.id === assignment.templateId);
            const prose = template?.selectionProse[0]
              ?? `${actor.name} takes up a new ambition: ${assignment.templateId}`;

            newEvents.push({
              id: nextAmbitionEventId(tick),
              tick,
              type: 'ambition_assigned',
              message: prose,
              significance: 0.5,
              actorId: actor.id,
              notification: { channel: 'toast' },
            });

            emitTrace({
              tick,
              category: 'ambition_progress',
              summary: `${actorLabel} assigned ambition ${assignment.templateId} (${assignment.priority})`,
              actorId: actor.id,
              templateId: assignment.templateId,
              result: 'assigned',
              priority: assignment.priority,
            });
          }
        }
      }
    }
  }

  // ── Aggregate residence trace — ONE per tick, never per-agent (THR-822) ──
  // Same typed-const discipline as the mint trace below: an inline literal hits the
  // emitTrace Omit-collapse trap and silently drops the union-member fields.
  if (actors.length > 0) {
    const residenceTrace: Omit<AgentResidenceTrace, 'id' | 'timestamp'> = {
      tick,
      category: 'agent_residence',
      summary:
        `Residence observed for ${actors.length} agent(s): ` +
        `${residenceCounts.moved} moved, ${residenceCounts['first-sighting']} first-seen, ` +
        `${residenceCounts.unchanged} settled, ${residenceCounts['no-position']} unplaced`,
      observed: actors.length,
      moved: residenceCounts.moved,
      firstSightings: residenceCounts['first-sighting'],
      unchanged: residenceCounts.unchanged,
      noPosition: residenceCounts['no-position'],
    };
    emitTrace(residenceTrace);
  }

  // ── Aggregate mint trace — ONE per tick, never per-agent (THR-726) ──
  // Typed const (not an inline literal) sidesteps the emitTrace Omit-collapse trap,
  // which strips union-member-specific fields — same pattern as encounterEventNode.
  if (mintedCount > 0) {
    const mintTrace: Omit<AmbitionMintedTrace, 'id' | 'timestamp'> = {
      tick,
      category: 'ambition_minted',
      summary: `World minted ${mintedCount} ambition(s) from events this tick`,
      mintedCount,
      byEventClass: mintedByEventClass,
      sampleAgentIds: mintedSampleAgentIds,
    };
    emitTrace(mintTrace);
  }

  if (newEvents.length === 0) return {};

  return {
    tickEvents: [...state.tickEvents, ...newEvents],
  };
}
