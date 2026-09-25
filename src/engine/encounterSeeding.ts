/**
 * Encounter Seeding — evaluate pending encounter seeds and spawn encounters.
 *
 * Seeds are planted by encounter aftermath reactions (encounter_seed effect kind)
 * and become eligible when `tick >= eligibleAfterTick`.
 *
 * Evaluation paths, in descending order of specificity:
 * - templateId set + template exists → create a unified action for the target agent
 * - `query` set, or `encounterFamily` with a row in {@link ENCOUNTER_FAMILY_TAGS} →
 *   THR-1488: resolve through the shared content-query resolver, filter to what this
 *   agent at this location can actually perform, draw one; nothing eligible falls back
 *   to the withered narrative event
 * - encounterFamily with no alias row → THR-697 (Slice D), kept one release: draw from
 *   the family by id prefix; nothing eligible → the same withered narrative event
 * - Neither produces a result → fail-soft expired event, seed removed
 *
 * THR-697 (Slice D) also threads inherited scene context: seeds planted with
 * `inheritContext: true` carry the source action's target + cast, re-validated against the
 * live graph at spawn, so the follow-up encounter stars the same people.
 *
 * Non-eligible seeds remain in the pending array for future ticks.
 *
 * NFP #4 (Fail-soft): Every code path terminates with a narrative event — never throws.
 * NFP #2 (Inspectability): Narrative events trace seed lifecycle (planted, spawned, expired).
 * NFP #3 (Determinism): rng passed explicitly; the family draw is one seeded rng() call.
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { AppointmentMissReason, PendingEncounterSeed, PlantedAppointment, UnifiedActionTemplate } from '../types/unifiedAction';
import {
  breakAppointmentFavour,
  computeAppointmentSlack,
  leaveMargin,
  readPlantedAppointment,
  redeemAppointmentFavour,
  writeAppointmentEvent,
} from './appointments';
import { resolveAxiologicalProfile } from './encounterScoring';
import { touchWorld } from './simulationRuntime';
import {
  APPOINTMENT_EVENT_SIGNIFICANCE,
  APPOINTMENT_MISSED_SEQUEL_DELAY_TICKS,
} from '../data/movement-content';
import { describeContentQuery as describeMissedQuery } from './contentQuery';
import type { EncounterSupportBinding } from '../types/encounter';
import type { GraphNode } from '../types/graph';
import type { WorldGraph } from './graph';
import type { SimulationRuntime } from './simulationRuntime';
import { getUnifiedTemplateById, UNIFIED_ACTION_TEMPLATES } from '../data/unified-action-templates';
import { createUnifiedAction } from './unifiedActionLifecycle';
import { appendRecentEvent } from './encounterAftermath';
import { emitTrace } from './traceBuffer';
import { getAgentLocation } from './graphQueries';
import { resolveToParentLocation } from './sublocationShape';
import { getGroupMembers, isAgentGone, isBandNode } from './groups/groupQueries';
import { FAMILY_SEED_MAX_CANDIDATES } from '../data/effect-constants';
import { STRATEGIC_CATALYST_REACTION_ID, UNDERTAKING_APPOINTMENT_REACTION_ID } from '../data/strategic-action-constants';
import {
  CONTENT_QUERY_MAX_CANDIDATES,
  describeContentQuery,
  resolveContentQuery,
  traceContentQuery,
} from './contentQuery';
import { sessionContentCatalogs } from './contentCatalogView';
import type { ContentQuery, ContentQuerySite } from '../types/contentQuery';
import type { ContentTag } from '../data/content-tags';

interface FamilyMatchResult {
  readonly templateId: string;
  readonly template: UnifiedActionTemplate;
  readonly candidateCount: number;
}

/**
 * The one-release alias table: a legacy `encounterFamily` id prefix → the family tag
 * that names the same set in game words (THR-1488, slice 4 of THR-1481).
 *
 * **What it is for.** Shipped aftermath content plants sequels by *id prefix*
 * (`encounterFamily: 'ac.quest'`). A prefix is a literal id one level up and rots the
 * same way: measured over the corpus on 2026-09-12, **41 of the 51 families the
 * aftermath names match no template at all**, and every one of those seeds has been
 * withering on arrival since it was written. The ten that do resolve are the rows
 * below; each names a family tag now carried by exactly the templates the prefix used
 * to match, so a shipped seed keeps finding the same set while the *mechanism* moves
 * onto the shared resolver.
 *
 * **A prefix with no row here is not an error.** It falls through to
 * {@link matchFamilyTemplate}, the pre-change prefix scan, for one release — which is
 * what keeps the forty-one dead families behaving exactly as they do today (they match
 * nothing and take the withered-narrative path) instead of turning a silent nothing
 * into a different silent nothing. `check:encounter` and the corpus sweep are where a
 * dead family is *reported*; this table is not a gate.
 *
 * **New content should author `query` instead.** The table exists to carry the corpus
 * across one release, not to be extended: a new family is a tag plus a seed that names
 * it, with no prefix in between.
 */
export const ENCOUNTER_FAMILY_TAGS: Readonly<Record<string, ContentTag>> = {
  // The twelve faction quest families (`fa.` has no quest templates, so no row).
  'ag.quest': '#guild_errand',
  'ac.quest': '#circle_errand',
  'bf.quest': '#fellowship_errand',
  'cg.quest': '#watch_errand',
  'hod.quest': '#dawn_errand',
  'lk.quest': '#covenant_errand',
  'mc.quest': '#company_errand',
  'mct.quest': '#consortium_errand',
  'rb.quest': '#ranger_errand',
  'ts.quest': '#temple_errand',
  'tg.quest': '#thieves_errand',
  'uk.quest': '#court_errand',
  // The four that are not a faction's posting.
  tavern: '#tavern_night',
  'encounter.delve': '#delve',
  'liminal.quest': '#threshold_errand',
  'broker.quest': '#broker_errand',
  'crafting.quest': '#craft_commission',
};

/**
 * The query a seed resolves by, or `undefined` when it has none.
 *
 * Authored `query` wins over an aliased family, so a migration can land the query
 * beside the old prefix and delete the prefix a release later.
 */
export function seedContentQuery(seed: PendingEncounterSeed): ContentQuery | undefined {
  if (seed.query) return seed.query;
  const tag = seed.encounterFamily ? ENCOUNTER_FAMILY_TAGS[seed.encounterFamily] : undefined;
  return tag ? { kind: 'encounter_template', tags: [tag] } : undefined;
}

/**
 * The query site a seed's resolution is traced at (THR-1497).
 *
 * One resolution site serves two planters — an aftermath's `encounter_seed` and an
 * undertaking's catalyst — and the trace must say which, because the census reads
 * reachability per site and the `catalyst_seeded` live claim filters on
 * `undertaking_catalyst`. Before this the site was registered and never emitted: every
 * seed traced as `encounter_seed`, so a catalyst that did resolve was invisible as one.
 * Provenance is the seed's `sourceReactionId`, the one field a catalyst seed already
 * carries that nothing else stamps.
 */
export function seedQuerySite(seed: PendingEncounterSeed): ContentQuerySite {
  if (seed.sourceReactionId === STRATEGIC_CATALYST_REACTION_ID) return 'undertaking_catalyst';
  // THR-1519: a work's appointment is the third planter on this one site.
  if (seed.sourceReactionId === UNDERTAKING_APPOINTMENT_REACTION_ID) return 'undertaking_appointment';
  return 'encounter_seed';
}

/**
 * The location subtype a seed's target is standing at, for the eligibility filter
 * (THR-1497).
 *
 * Resolved to the **Location** tier: a mortal inside a Place — a market district, a
 * palace keep — is standing in the town or capital that contains it, and that is the
 * subtype a `locationSubtypes` gate asks about. A Place node carries no
 * `locationSubtype` of its own, so the raw `located_at` read returned `undefined`
 * there and every subtype-gated family withered for a target who was, by the game's
 * own position model, exactly where the family wanted them. Measured on seed 42 /
 * medium over 200 ticks: three of ten catalyst seeds fired with their actor inside
 * a Place of a settlement the family accepted, and all three resolved empty.
 *
 * A dangling `parentLocationId` resolves to `undefined`, which the filter treats as
 * "nowhere the family accepts" — fail-soft, and the same nothing as before.
 */
export function seedTargetSubtype(graph: WorldGraph, targetAgentId: string): string | undefined {
  const located = getAgentLocation(graph, targetAgentId);
  return locationTierSubtype(graph, located);
}

/**
 * The location subtype of a seed's `resolutionLocationId` anchor, resolved to the
 * Location tier exactly as {@link seedTargetSubtype} resolves the target's feet
 * (THR-1511). `undefined` when the seed carries no anchor or the anchor is gone —
 * both mean "judge at the feet", which is the pre-THR-1511 behaviour verbatim.
 */
export function seedAnchorSubtype(graph: WorldGraph, seed: PendingEncounterSeed): string | undefined {
  if (!seed.resolutionLocationId) return undefined;
  return locationTierSubtype(graph, graph.getNode(seed.resolutionLocationId));
}

function locationTierSubtype(graph: WorldGraph, node: GraphNode | undefined): string | undefined {
  const locationNode = resolveToParentLocation(graph, node);
  return locationNode
    ? ((locationNode.properties.locationSubtype ?? locationNode.properties.locationType) as string | undefined)
    : undefined;
}

/**
 * The location the seeding site judges a query-resolved seed at, and which of the
 * two candidates it was (THR-1511). The anchor is tried first; the feet second. The
 * order is the whole fix — see {@link resolveSeedByQuery}.
 */
interface JudgedLocation {
  readonly subtype: string | undefined;
  readonly locationId: string | undefined;
  readonly judgedAt: 'resolution_anchor' | 'target_location';
}

function seedJudgedLocations(graph: WorldGraph, seed: PendingEncounterSeed): readonly JudgedLocation[] {
  const feet: JudgedLocation = {
    subtype: seedTargetSubtype(graph, seed.targetAgentId),
    locationId: resolveToParentLocation(graph, getAgentLocation(graph, seed.targetAgentId))?.id,
    judgedAt: 'target_location',
  };
  if (!seed.resolutionLocationId) return [feet];
  const anchorNode = resolveToParentLocation(graph, graph.getNode(seed.resolutionLocationId));
  // A dangling anchor is not a place; judge at the feet, exactly as before.
  if (!anchorNode) return [feet];
  const anchor: JudgedLocation = {
    subtype: seedAnchorSubtype(graph, seed),
    locationId: anchorNode.id,
    judgedAt: 'resolution_anchor',
  };
  // The same place twice is one judgement, not two.
  return anchor.locationId === feet.locationId ? [anchor] : [anchor, feet];
}

/**
 * The `'query:<kind>'` token the plan's fail-soft table specifies for a withered
 * query-only seed, delegated to the one describer in `contentQuery.ts` so a trace here
 * and a gate line there name the same query the same way.
 */
function describeSeedQuery(query: ContentQuery | undefined): string {
  return query ? describeContentQuery(query) : 'none';
}

/**
 * The family tag's own word, for the one player-facing sentence a withered query-only
 * seed produces — `#circle_errand` → `circle errand`.
 *
 * Safe to read as prose *because of how the tags were named*: a family tag is required
 * to be the word the codex would use (THR-1488), never the id spelling, so unwrapping
 * one cannot leak `ac.quest` into a narrative event the way the prefix form does.
 */
function seedQueryPhrase(query: ContentQuery | undefined): string | undefined {
  const first = query?.tags?.[0] ?? query?.anyTags?.[0];
  return first ? first.slice(1).replace(/_/gu, ' ') : undefined;
}

/**
 * Resolve a seed's query to one concrete template (THR-1488).
 *
 * Three steps, in this order, and the order is the point:
 *
 * 1. **The shared resolver decides what the query names.** `resolveContentQuery` over
 *    the session catalogs — never a second tag predicate here, which is the failure
 *    `content-query-one-resolver-engine-and-gate` exists to prevent.
 * 2. **The seeding site decides what it can spawn.** Membership in a family is not
 *    eligibility: a template must still be individual-performable and must still
 *    accept the target's current location subtype, exactly as
 *    {@link matchFamilyTemplate} required. Folding these into the query would mean
 *    teaching the resolver about actors and locations, which is a different question
 *    from "what content is this".
 * 3. **One seeded `rng()` call over the capped head**, so the draw stays a single
 *    PRNG consumption (NFP #3) and a pathologically wide query is bounded.
 *
 * Two behaviour notes, both deliberate and both visible in the trace:
 *
 * - **Candidate order is now total** (registry kind order, then id ascending) where the
 *   prefix scan used catalog array order. For every family that resolves today the
 *   *set* is identical — the widest is `#tavern_night` at ten — so this changes which
 *   member a given seed draws, not which members were available. A total order is the
 *   determinism the resolver promises; array order was an accident of file layout.
 * - **The cap rises from `FAMILY_SEED_MAX_CANDIDATES` (12) to
 *   {@link CONTENT_QUERY_MAX_CANDIDATES} (64)**, per the plan's retirement of the
 *   former into the latter. No family in the corpus reaches either, so nothing shipped
 *   changes; what changes is that one number now bounds every query site instead of
 *   each site carrying its own.
 */
function resolveSeedByQuery(
  graph: WorldGraph,
  seed: PendingEncounterSeed,
  query: ContentQuery,
  rng: () => number,
  tick: number,
): FamilyMatchResult | undefined {
  // THR-1511: a catalyst seed carries the Location the work stands at, and the gate
  // is judged there first — the wake of a road laid from a fort is offered in the
  // town the road reaches, not at the fort. The target's own feet are tried second,
  // so an anchor the family rejects (a hamlet, a camp) costs nothing over the old
  // behaviour, and a seed with no anchor takes exactly the old path. The resolver's
  // hit list is the same either way (it knows nothing of locations); only the
  // eligibility filter moves. One `rng()` draw regardless (NFP #3).
  const catalogs = sessionContentCatalogs(graph);
  let eligible: UnifiedActionTemplate[] = [];
  let judged: JudgedLocation | undefined;
  for (const where of seedJudgedLocations(graph, seed)) {
    judged = where;
    eligible = eligibleAt(query, catalogs, where.subtype);
    if (eligible.length > 0) break;
  }

  // Traced on both outcomes, so a family that went hungry is distinguishable from a
  // site that never ran — the indistinguishability the 41 dead families hid behind.
  const pick = eligible.length > 0
    ? eligible[Math.floor(rng() * eligible.length)]
    : undefined;
  traceContentQuery({
    site: seedQuerySite(seed),
    query,
    candidateCount: eligible.length,
    tick,
    pickedId: pick?.id,
    actorId: seed.targetAgentId,
    templateId: seed.sourceEncounterId,
    judgedAtLocationId: judged?.locationId,
    judgedAt: judged?.judgedAt,
  });

  if (!pick) return undefined;
  return { templateId: pick.id, template: pick, candidateCount: eligible.length };
}

/**
 * The query's hits this seeding site can spawn at a location of the given subtype:
 * individual-performable, and either ungated or gated to that subtype. Capped at
 * {@link CONTENT_QUERY_MAX_CANDIDATES}.
 */
function eligibleAt(
  query: ContentQuery,
  catalogs: ReturnType<typeof sessionContentCatalogs>,
  subtype: string | undefined,
): UnifiedActionTemplate[] {
  const eligible: UnifiedActionTemplate[] = [];
  for (const hit of resolveContentQuery(query, catalogs)) {
    const template = getUnifiedTemplateById(hit.id);
    if (!template) continue;
    if (!template.actorAffinities?.includes('individual')) continue;
    if (template.locationSubtypes && template.locationSubtypes.length > 0) {
      if (!subtype || !template.locationSubtypes.includes(subtype)) continue;
    }
    eligible.push(template);
    if (eligible.length >= CONTENT_QUERY_MAX_CANDIDATES) break;
  }
  return eligible;
}

/**
 * THR-697 (Slice D) — resolve a family-only seed to a concrete template.
 *
 * Candidates are registered unified templates whose `id` starts with `${family}.` (the same
 * prefix convention THR-112 `revealFamilies` uses — no separate family registry), filtered to
 * individual-performable templates whose location-subtype restriction (if any) matches the
 * target agent's current location. The scan collects up to `FAMILY_SEED_MAX_CANDIDATES`
 * eligibles, then makes exactly one seeded `rng()` draw over them.
 *
 * Returns undefined when the seed has no family or no eligible candidate — the caller then
 * keeps the v1 withered-narrative fallback byte-identical.
 */
function matchFamilyTemplate(
  graph: WorldGraph,
  seed: PendingEncounterSeed,
  rng: () => number,
): FamilyMatchResult | undefined {
  const family = seed.encounterFamily;
  if (!family) return undefined;
  const prefix = `${family}.`;

  const subtype = seedTargetSubtype(graph, seed.targetAgentId);

  const eligible: UnifiedActionTemplate[] = [];
  for (const template of UNIFIED_ACTION_TEMPLATES) {
    if (!template.id.startsWith(prefix)) continue;
    // (a) agent-performable
    if (!template.actorAffinities?.includes('individual')) continue;
    // (b) location-subtype eligibility (templates with no restriction always pass)
    if (template.locationSubtypes && template.locationSubtypes.length > 0) {
      if (!subtype || !template.locationSubtypes.includes(subtype)) continue;
    }
    eligible.push(template);
    if (eligible.length >= FAMILY_SEED_MAX_CANDIDATES) break;
  }
  if (eligible.length === 0) return undefined;

  const pick = eligible[Math.floor(rng() * eligible.length)];
  return { templateId: pick.id, template: pick, candidateCount: eligible.length };
}

interface ResolvedInheritance {
  /** True iff the seed carried inherited scene context (inheritContext was set at plant). */
  readonly applied: boolean;
  /** Target for the spawned action: the inherited target if still alive, else self-target. */
  readonly targetId: string;
  /** Inherited cast bindings that survived graph re-validation, else undefined. */
  readonly bindings?: readonly EncounterSupportBinding[];
  /** Inherited target that survived re-validation, or null (fell back to self-target). */
  readonly inheritedTargetId: string | null;
  readonly bindingCount: number;
  readonly droppedBindingCount: number;
}

/**
 * THR-697 (Slice D) — re-validate a seed's inherited scene context against the live graph at
 * spawn time. A dead inherited target falls back to self-target; bindings whose node is gone
 * are dropped. Pure; the caller emits the `seed_context_inherited` trace when `applied`.
 */
function resolveSeedInheritance(
  seed: PendingEncounterSeed,
  graph: WorldGraph,
  tick: number,
): ResolvedInheritance {
  const applied = seed.inheritedTargetId !== undefined || seed.inheritedBindings !== undefined;

  let targetId = seed.targetAgentId;
  let inheritedTargetId: string | null = null;
  if (seed.inheritedTargetId && graph.getNode(seed.inheritedTargetId)) {
    targetId = seed.inheritedTargetId;
    inheritedTargetId = seed.inheritedTargetId;
  }

  let bindings: readonly EncounterSupportBinding[] | undefined;
  let bindingCount = 0;
  let droppedBindingCount = 0;
  if (seed.inheritedBindings && seed.inheritedBindings.length > 0) {
    // THR-1296 §4: the drop keeps its semantics and stops being silent.
    //
    // Two changes, both small. The survivor test is now the **dual gone-test** — this
    // site checked node absence only while its sibling used `isAgentGone`, so a
    // deceased echo (THR-479 keeps those nodes forever) survived inheritance here and
    // not there. That inconsistency was inherited deliberately; it no longer is.
    // And each drop emits `binding_severed`, so a scene that quietly lost its cast
    // between planting and spawning says so.
    const survivors = seed.inheritedBindings.filter(b => {
      const node = graph.getNode(b.nodeId);
      const gone = !node || (b.kind === 'actor' && isAgentGone(node));
      if (gone) {
        emitTrace({
          category: 'binding_severed',
          tick,
          projectId: seed.seedId,
          castKey: b.key,
          nodeId: b.nodeId,
          cause: 'seed_drop',
          persistence: b.persistence,
          summary:
            `seed binding dropped: ${b.key} (${b.persistence}) of seed ${seed.seedId} — ` +
            `${!node ? 'node removed' : 'deceased'}`,
        });
      }
      return !gone;
    });
    droppedBindingCount = seed.inheritedBindings.length - survivors.length;
    bindingCount = survivors.length;
    bindings = survivors.length > 0 ? survivors : undefined;
  }

  return { applied, targetId, bindings, inheritedTargetId, bindingCount, droppedBindingCount };
}

/**
 * THR-731 (PR 3) — re-validate a seed's named opponent at spawn time.
 *
 * PR 2 declared `PendingEncounterSeed.opposingGroupId` and wired the *resolution*
 * side to honour `UnifiedAction.opposingGroupId`, but nothing carried the value
 * across the seed → action boundary, so a seed that named its enemy dropped it in
 * silence. This is that carry, and it re-checks rather than copies: a band can
 * dissolve, empty out, or be disbanded in the delay between planting a grudge and
 * collecting on it.
 *
 * Returns undefined for every case that should spawn an ordinary uncontested
 * encounter — no named opponent, opponent gone, opponent no longer a live band.
 * The company still gets its encounter; it just does not get a fight (NFP #4).
 */
function resolveSeedOpposition(
  seed: PendingEncounterSeed,
  graph: WorldGraph,
): string | undefined {
  const opposingGroupId = seed.opposingGroupId;
  if (!opposingGroupId) return undefined;

  const band = graph.getNode(opposingGroupId);
  if (!band || !isBandNode(band)) return undefined;
  if ((band.properties as Record<string, unknown>).groupStatus !== 'active') return undefined;
  if (getGroupMembers(graph, opposingGroupId).every(isAgentGone)) return undefined;

  return opposingGroupId;
}

export function evaluateEncounterSeeds(state: GameState, tick: number, rng: () => number, runtime?: SimulationRuntime): GameState {
  const seeds = state.pendingEncounterSeeds ?? [];
  if (seeds.length === 0) return state;

  const eligible: PendingEncounterSeed[] = [];
  const remaining: PendingEncounterSeed[] = [];

  for (const seed of seeds) {
    if (tick >= seed.eligibleAfterTick) {
      eligible.push(seed);
    } else {
      remaining.push(seed);
    }
  }

  if (eligible.length === 0) return state;

  let nextActions = [...state.unifiedActions];
  let nextTickEvents = [...state.tickEvents];
  let nextRecentEvents = [...state.recentEvents];

  // THR-1479 — the meeting was kept: the promise is redeemed, the Event kind records
  // it, and the chronicle gets its line. One writer for both exits of a kept seed
  // (THR-1519): the fired path and the withered path. Keeping is *presence* — a
  // mortal who stood at the place in the window kept their word whether or not the
  // world had a scene to offer them, so a kept meeting whose sequel withered (the
  // family gated to settlements, the place a ruin) must not leave the promise on the
  // sheet unredeemed and the milestone uncounted. Measured on seed 42 before this:
  // three `create × Agreement` meetings kept at a ruin, three dangling promises, zero
  // `appointment_kept` Events.
  const recordKeptAppointment = (seed: PendingEncounterSeed, kept: PlantedAppointment, resolvedTemplateId: string): void => {
    redeemAppointmentFavour(state.graph, kept.favourEdgeId);
    writeAppointmentEvent(state.graph, {
      kind: 'appointment_kept', agentId: seed.targetAgentId, locationId: kept.locationId,
      tick, seedId: seed.seedId,
    });
    if (runtime) touchWorld(runtime);
    const agentName = state.graph.getNode(seed.targetAgentId)?.name ?? seed.targetAgentId;
    const placeName = state.graph.getNode(kept.locationId)?.name ?? kept.locationId;
    const keptEvent: TickEvent = {
      id: `${seed.seedId}_kept`,
      tick,
      type: 'narrative',
      message: `${agentName} keeps their word at ${placeName}.`,
      significance: APPOINTMENT_EVENT_SIGNIFICANCE,
      actorId: seed.targetAgentId,
    };
    nextTickEvents = [...nextTickEvents, keptEvent];
    nextRecentEvents = appendRecentEvent(nextRecentEvents, keptEvent);
    emitTrace({
      tick, category: 'appointment_kept', agentId: seed.targetAgentId,
      seedId: seed.seedId, locationId: kept.locationId, dueTick: kept.dueTick,
      arrivedTick: tick, resolvedTemplateId,
      summary: `Appointment kept: ${agentName} at ${placeName} (due ${kept.dueTick}, tick ${tick}) → ${resolvedTemplateId}`,
    });
  };

  for (const pendingSeed of eligible) {
    // Reassigned by the appointment arm below (a kept meeting is judged at its place;
    // a lost place fires the kept branch placeless). Every other seed passes through.
    let seed: PendingEncounterSeed = pendingSeed;
    const ticksSincePlant = tick - (seed.plantedTick ?? tick);

    // THR-1025: a seed whose target does not resolve to a live node can only produce a
    // phantom action — one that spawns, runs the tick loop, and fails every graph write
    // it attempts, silently. Discard it here instead. This is the backstop for the
    // unbound-sentinel class (an aftermath sentinel the bind pass could not resolve stays
    // a literal token, e.g. the bare string `$actor`), and equally for a target that has
    // simply died between plant and eligibility.
    if (!state.graph.getNode(seed.targetAgentId)) {
      const orphanEvent: TickEvent = {
        id: `${seed.seedId}_orphaned`,
        tick,
        type: 'narrative',
        message: `A planted thread lost the one it was meant for: ${seed.seedLabel}`,
        significance: 0.3,
        actorId: seed.targetAgentId,
      };
      nextTickEvents = [...nextTickEvents, orphanEvent];
      nextRecentEvents = appendRecentEvent(nextRecentEvents, orphanEvent);
      emitTrace({
        tick, category: 'encounter_seed_triggered',
        agentId: seed.targetAgentId,
        seedId: seed.seedId,
        targetAgentId: seed.targetAgentId,
        ticksBetweenPlantAndTrigger: ticksSincePlant,
        resolvedTemplateId: 'none',
        outcome: 'discarded',
        discardReason: 'target_agent_missing',
        summary: `Seed discarded: target "${seed.targetAgentId}" is not a live node — "${seed.seedLabel}"`,
      });
      continue;
    }

    // ── THR-1479: the appointment arm — kept, missed, wait, or the place is gone ──
    //
    // Runs before the resolution ladder because the ladder is what fires the *kept*
    // branch; a missed seed is rewritten into its missed branch and returned to the
    // queue, to fire wherever the mortal is through the unchanged placeless path.
    // Kept requires the hex, not the node: standing at any Place inside the
    // Location's hex is keeping it (the awareness rule), so a town meeting cannot be
    // missed by standing in the wrong inn.
    let keptAppointment: PlantedAppointment | null = null;
    {
      const appointment = readPlantedAppointment(seed);
      if (appointment) {
        const slack = computeAppointmentSlack(state.graph, seed.targetAgentId, appointment, tick);
        const windowOpen = tick <= appointment.dueTick + appointment.windowTicks;
        if (!slack) {
          // The world lost the place — a dissolved settlement, a dangling id. The
          // kept branch fires wherever they are: the world broke the promise, not
          // the mortal, so the favour is released rather than broken.
          redeemAppointmentFavour(state.graph, appointment.favourEdgeId);
          if (runtime) touchWorld(runtime);
          // THR-1560: a meeting that must have its place (a hunt's confront) is dropped
          // rather than fired wherever the mortal stands. The favour is released first,
          // above — a drop before it would leave the promise live, and the hunt's
          // one-confront refusal would read that lair as pending for good.
          const drop = appointment.requirePlace === true;
          emitTrace({
            tick, category: 'appointment_missed', agentId: seed.targetAgentId,
            seedId: seed.seedId, locationId: appointment.locationId, dueTick: appointment.dueTick,
            reason: 'place_lost',
            ...(drop ? { dropped: true } : {}),
            summary: drop
              ? `Appointment place lost: ${seed.targetAgentId} — "${seed.seedLabel}" dropped (the meeting needs its place)`
              : `Appointment place lost: ${seed.targetAgentId} — "${seed.seedLabel}" fires placeless`,
          });
          if (drop) continue;
          seed = { ...seed, appointment: undefined };
        } else if (windowOpen && slack.atPlace) {
          keptAppointment = appointment;
          // THR-1511's field: a subtype-gated query is judged at the place, not the feet.
          seed = { ...seed, resolutionLocationId: appointment.locationId };
        } else if (windowOpen) {
          // Due, in the window, not there yet — the seed waits. Arriving early is fine.
          remaining.push(seed);
          continue;
        } else {
          // The window closed. Rewrite the seed into its missed branch and return it
          // to the queue; the favour is broken and stays on the sheet until the
          // reckoning's aftermath retires it.
          const profile = resolveAxiologicalProfile(state.graph, seed.targetAgentId, tick);
          const reason: AppointmentMissReason = !Number.isFinite(slack.travelTicks)
            ? 'unreachable'
            : leaveMargin(profile) < 0 ? 'chose_to_miss' : 'absent';
          const missed = appointment.missed;
          const converted: PendingEncounterSeed = {
            ...seed,
            templateId: missed.templateId,
            query: missed.query,
            encounterFamily: undefined,
            resolutionLocationId: undefined,
            eligibleAfterTick: tick + (missed.delayTicks ?? APPOINTMENT_MISSED_SEQUEL_DELAY_TICKS),
            seedLabel: missed.seedLabel,
            // THR-1560: the inherited target belongs to the kept branch alone — the
            // missed sequel fires wherever the mortal is, aimed at no beast.
            ...(appointment.inheritSiteAsTarget ? { inheritedTargetId: undefined } : {}),
            appointment: undefined,
            missedAppointment: { locationId: appointment.locationId, dueTick: appointment.dueTick, reason },
          };
          breakAppointmentFavour(state.graph, appointment.favourEdgeId, tick);
          writeAppointmentEvent(state.graph, {
            kind: 'appointment_missed', agentId: seed.targetAgentId, locationId: appointment.locationId,
            tick, seedId: seed.seedId, reason,
          });
          if (runtime) touchWorld(runtime);
          const agentName = state.graph.getNode(seed.targetAgentId)?.name ?? seed.targetAgentId;
          const placeName = state.graph.getNode(appointment.locationId)?.name ?? appointment.locationId;
          const missedEvent: TickEvent = {
            id: `${seed.seedId}_missed`,
            tick,
            type: 'narrative',
            message: `${agentName} was not at ${placeName} when the time came round.`,
            significance: APPOINTMENT_EVENT_SIGNIFICANCE,
            actorId: seed.targetAgentId,
          };
          nextTickEvents = [...nextTickEvents, missedEvent];
          nextRecentEvents = appendRecentEvent(nextRecentEvents, missedEvent);
          emitTrace({
            tick, category: 'appointment_missed', agentId: seed.targetAgentId,
            seedId: seed.seedId, locationId: appointment.locationId, dueTick: appointment.dueTick,
            reason,
            missedTemplateId: missed.templateId,
            missedQuery: missed.query ? describeMissedQuery(missed.query) : undefined,
            summary: `Appointment missed (${reason}): ${agentName} was not at ${placeName} by tick ${appointment.dueTick + appointment.windowTicks} — "${missed.seedLabel}" now due tick ${converted.eligibleAfterTick}`,
          });
          remaining.push(converted);
          continue;
        }
      }
    }

    // Resolve the template to spawn, in three descending degrees of specificity:
    // a direct `templateId`, then a `query` (THR-1488 — either authored, or the
    // alias table's rewrite of a legacy `encounterFamily` prefix), then the
    // pre-change prefix scan for a family with no alias row.
    let template: UnifiedActionTemplate | undefined;
    let resolvedTemplateId: string | undefined;
    let familyMatch: FamilyMatchResult | undefined;

    if (seed.templateId) {
      template = getUnifiedTemplateById(seed.templateId);
      if (template) resolvedTemplateId = seed.templateId;
      // templateId set but not found → fall through to query / family / fail-soft below.
    }
    const query = template ? undefined : seedContentQuery(seed);
    if (!template && query) {
      // THR-1488: the shared content-query resolver, for an authored query and for
      // every family the alias table can name.
      familyMatch = resolveSeedByQuery(state.graph, seed, query, rng, tick);
      if (familyMatch) {
        template = familyMatch.template;
        resolvedTemplateId = familyMatch.templateId;
      }
    }
    if (!template && !query && seed.encounterFamily) {
      // THR-697 (Slice D), kept for one release: a family with no alias row still
      // resolves by id prefix, so the forty-one dead families behave exactly as they
      // do today rather than changing shape on the way to being reported.
      familyMatch = matchFamilyTemplate(state.graph, seed, rng);
      if (familyMatch) {
        template = familyMatch.template;
        resolvedTemplateId = familyMatch.templateId;
      }
    }

    if (template && resolvedTemplateId) {
      // Check if target agent is not already in an active action
      const agentBusy = nextActions.some(
        a => a.actorId === seed.targetAgentId && !a.resolved
      );
      if (agentBusy) {
        // Agent busy — keep seed for next tick (not triggered yet, no trace)
        remaining.push(seed);
        continue;
      }

      // Slice D: family-match trace fires before the shared spawn/trigger traces.
      if (familyMatch) {
        emitTrace({
          tick, category: 'encounter_seed_family_matched',
          agentId: seed.targetAgentId,
          seedId: seed.seedId,
          // THR-1488: a query-only seed has no prefix to name, so the trace names the
          // query instead of printing an empty string that reads like a missing field.
          family: seed.encounterFamily ?? describeSeedQuery(query),
          candidateCount: familyMatch.candidateCount,
          resolvedTemplateId,
          summary: `Family seed matched: "${seed.seedLabel}" → ${resolvedTemplateId} (${familyMatch.candidateCount} candidate${familyMatch.candidateCount === 1 ? '' : 's'})`,
        } as unknown as Parameters<typeof emitTrace>[0]);
      }

      // Slice D: re-validate inherited scene context against the live graph.
      const inherit = resolveSeedInheritance(seed, state.graph, tick);
      if (inherit.applied) {
        emitTrace({
          tick, category: 'seed_context_inherited',
          agentId: seed.targetAgentId,
          seedId: seed.seedId,
          inheritedTargetId: inherit.inheritedTargetId,
          bindingCount: inherit.bindingCount,
          droppedBindingCount: inherit.droppedBindingCount,
          summary: `Seed context inherited: "${seed.seedLabel}" target=${inherit.inheritedTargetId ?? 'self'} bindings=${inherit.bindingCount}${inherit.droppedBindingCount > 0 ? ` (dropped ${inherit.droppedBindingCount})` : ''}`,
        } as unknown as Parameters<typeof emitTrace>[0]);
      }

      // THR-143: set causation fields so executeStepResult can emit the edge once
      // an event node exists for both endpoints. The edge is emitted in
      // unifiedActionResolution.ts when the seeded action's first step resolves.
      const spawnedAction = createUnifiedAction({
        actorId: seed.targetAgentId,
        templateId: resolvedTemplateId,
        // Slice D: inherited target if it survived re-validation, else self-target (v1 fallback).
        targetId: inherit.targetId,
        // Slice D: inherited cast survivors flow into the normal supportBindings slot.
        supportBindings: inherit.bindings,
        scale: template.scale,
        source: 'system',
        tick,
        template,
        rng,
        // THR-1100: target-derived step duration for tier-scaled templates.
        targetProperties: state.graph.getNode(inherit.targetId)?.properties,
      });
      // THR-1497: the seed's provenance rides every spawned action, not only one with
      // a causation source. The `caused_by` edge still needs `sourceEventNodeId`
      // (`pendingCausationSourceEventId` gates that whole block), but "which seed
      // spawned this" is a fact about the action whether or not an event node
      // planted it — and it is the one durable record of a resolution once the trace
      // ring has evicted the `content.query_resolved` that made it.
      const withCausation = {
        ...spawnedAction,
        spawnedFromSeedId: seed.seedId,
        spawnedFromSeedLabel: seed.seedLabel,
        ...(seed.sourceEventNodeId ? { pendingCausationSourceEventId: seed.sourceEventNodeId } : {}),
      };
      // THR-731 (PR 3): carry the seed's named opponent onto the action, which is
      // what `findOpposingBand` reads to pair the contest deliberately instead of
      // rediscovering an opponent by colocation.
      const opposingGroupId = resolveSeedOpposition(seed, state.graph);
      const action = opposingGroupId
        ? { ...withCausation, opposingGroupId }
        : withCausation;
      nextActions = [...nextActions, action];

      const spawnEvent: TickEvent = {
        id: `${seed.seedId}_spawned`,
        tick,
        type: 'narrative',
        message: familyMatch
          ? `A planted thread bears fruit: ${seed.seedLabel} — ${template.name}`
          : `A planted thread bears fruit: ${seed.seedLabel}`,
        significance: 0.65,
        actorId: seed.targetAgentId,
      };
      nextTickEvents = [...nextTickEvents, spawnEvent];
      nextRecentEvents = appendRecentEvent(nextRecentEvents, spawnEvent);
      emitTrace({
        tick, category: 'encounter_seed_triggered',
        agentId: seed.targetAgentId,
        seedId: seed.seedId,
        targetAgentId: seed.targetAgentId,
        ticksBetweenPlantAndTrigger: ticksSincePlant,
        resolvedTemplateId,
        outcome: 'fired',
        summary: `Seed fired: "${seed.seedLabel}" → ${resolvedTemplateId} for ${seed.targetAgentId}`,
      });

      // THR-1479 — the meeting was kept: the promise is redeemed, the Event kind
      // records it, and the chronicle gets its line.
      if (keptAppointment) recordKeptAppointment(seed, keptAppointment, resolvedTemplateId);
      continue;
    }

    // Family-only seed with no eligible template → v1 withered narrative event, preserved
    // byte-identical (THR-697 fail-soft: no eligible → existing withered path unchanged).
    //
    // THR-1488: a seed carrying only a `query` fails into the same path, because
    // "the family I promised is empty right now" is the same event whether the family
    // was named by prefix or by tag. `describeSeedQuery` supplies the noun the message
    // and the trace need.
    if (seed.encounterFamily || query) {
      // THR-143: family-only fires are advisory — no action is spawned, so no event node
      // will be created and no caused_by edge is possible in v1 scope.
      const familyEventId = `${seed.seedId}_family_ready`;
      if (seed.sourceEventNodeId) {
        emitTrace({
          tick, category: 'causation_edge_creation_skipped',
          sourceEventId: familyEventId,
          causedByEventId: seed.sourceEventNodeId,
          seedId: seed.seedId,
          reason: 'family_only_no_action_node',
          summary: `Causation edge skipped (family-only): no action node spawned for "${seed.seedLabel}"`,
        });
      }

      // A prefix seed keeps its existing sentence verbatim; a query-only seed borrows
      // the family tag's own word, which is a game word by construction (that is the
      // rule the tags were named under) rather than an id spelling.
      const familyNoun = seed.encounterFamily ?? seedQueryPhrase(query) ?? 'kindred';
      const familyEvent: TickEvent = {
        id: familyEventId,
        tick,
        type: 'narrative',
        message: `The consequences of ${seed.seedLabel} are stirring — a ${familyNoun} encounter may surface soon.`,
        significance: 0.55,
        actorId: seed.targetAgentId,
      };
      nextTickEvents = [...nextTickEvents, familyEvent];
      nextRecentEvents = appendRecentEvent(nextRecentEvents, familyEvent);
      // Seed consumed — family matching is best-effort narrative for v1
      emitTrace({
        tick, category: 'encounter_seed_triggered',
        agentId: seed.targetAgentId,
        seedId: seed.seedId,
        targetAgentId: seed.targetAgentId,
        ticksBetweenPlantAndTrigger: ticksSincePlant,
        resolvedTemplateId: seed.encounterFamily
          ? `family:${seed.encounterFamily}`
          : describeSeedQuery(query),
        outcome: 'fired',
        summary: `Seed fired (family-only narrative): "${seed.seedLabel}" → ${seed.encounterFamily ?? describeSeedQuery(query)}`,
      });
      // THR-1519 — kept, but the world had nothing to say: the word was still kept.
      if (keptAppointment) {
        recordKeptAppointment(seed, keptAppointment, `withered:${seed.encounterFamily ?? describeSeedQuery(query)}`);
      }
      continue;
    }

    // Neither templateId nor family — fail-soft
    const expiredEvent: TickEvent = {
      id: `${seed.seedId}_expired`,
      tick,
      type: 'narrative',
      message: `A planted thread withered before it could take root: ${seed.seedLabel}`,
      significance: 0.3,
      actorId: seed.targetAgentId,
    };
    nextTickEvents = [...nextTickEvents, expiredEvent];
    nextRecentEvents = appendRecentEvent(nextRecentEvents, expiredEvent);
    emitTrace({
      tick, category: 'encounter_seed_triggered',
      agentId: seed.targetAgentId,
      seedId: seed.seedId,
      targetAgentId: seed.targetAgentId,
      ticksBetweenPlantAndTrigger: ticksSincePlant,
      resolvedTemplateId: 'none',
      outcome: 'discarded',
      discardReason: 'no_template_or_family',
      summary: `Seed discarded (no template or family): "${seed.seedLabel}"`,
    });
  }

  return {
    ...state,
    unifiedActions: nextActions,
    tickEvents: nextTickEvents,
    recentEvents: nextRecentEvents,
    pendingEncounterSeeds: remaining,
  };
}
