/**
 * The no-op gate — THR-1212 slice 5.
 *
 * The third row of the typed-seam contract table, and the only one that runs against
 * a world that actually exists. The other three ask cheaper questions:
 *
 * - the **static classifier** (`check:chip-anchors`) asks *could this declaration ever
 *   resolve* — 0 violations across the corpus,
 * - the **live resolver** (`resolveWorldRef`) asks *what does it resolve to here*, and
 *   drops rather than throwing,
 * - the **ratchet** (`check:chip-anchors --baseline`) asks *is the unscoped population
 *   shrinking*.
 *
 * All three can be green while the content is broken, and THR-1165 is the proof: two
 * `$cast:` sentinels passed every compile-time and authoring-time check while the
 * caravan they named was never cast, because the template's `supportBundle` was
 * bind-only and the binder produced `supportBindings: []`. A static type is necessary
 * and never sufficient (THR-1160). This test is the sufficiency half.
 *
 * **What it does.** Builds a seeded world through the real
 * `initializeGameState` → `runTick` pipeline, stages each template's cast through the
 * real `prepareEncounterSupportBundle` rather than an invented map, runs every declared
 * chip anchor through `fromConceptRef` → `resolveWorldRef`, and asserts the id that
 * comes back names an object that is really there.
 *
 * **Two vacuity guards, because this test's failure mode is passing over nothing.**
 * The empty-population pass is a known pathology in this repo, and it is especially
 * available here: 665 of 698 templates declare no anchor at all, so a walk that
 * silently returned `[]` would pass every assertion below. So (a) the population is
 * asserted non-empty *per form*, not just in total — "all faction anchors resolve" is
 * worthless if zero faction anchors exist — and (b) `EXPECTED_FORMS` is a closed set:
 * a form appearing in the corpus with no disposition here fails by name rather than
 * being skipped, the `assertEveryMemberAnnotated` pattern the anchor catalog uses.
 *
 * Plan: `Docs/plans/2026-08-27-shared-anchor-machinery.md`
 */

import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../gameInit';
import { runTick, resetDecisionCache, resetEventCounter } from '../../orchestrator';
import { createBalancedCosmology } from '../../cosmology';
import { generateArchetypes } from '../../ascendant';
import { createSimulationRuntime } from '../../simulationRuntime';
import { prepareEncounterSupportBundle } from '../../encounterSupportBundle';
import { getAttachmentTemplateNode } from '../../attachmentTemplateIndex';
import { resolveWorldRef, clearWorldRefDrops, getWorldRefDrops } from '../../worldRefResolver';
import type { WorldGraph } from '../../graph';
import { UNIFIED_ACTION_TEMPLATES } from '../../../data/unified-action-templates';
import { declaredChipAnchors } from '../../../data/content-eval/compositionContract';
import {
  classifyAnchorDeclaration,
  ANCHOR_SENTINEL_FACTION_PREFIX,
} from '../../../data/content-eval/chipAnchorDeclarations';
import { fromConceptRef } from '../../../types/worldRefAdapters';
import { parseHexRefId } from '../../../types/worldRef';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';
import type { GameState } from '../../../types/gameState';
import { WORLD_SIM_TEST_TIMEOUT_MS } from '../../../testing/testTimeouts';

const SEED = 42;

/**
 * Ticks run before anchors are resolved.
 *
 * Enough that the world is a *run* rather than a freshly-seeded snapshot — agents have
 * moved, encounters have spawned, factions have acted — without paying for a long
 * simulation this test does not read. Named per NFP #1.
 */
const NOOP_GATE_TICK_BUDGET = 20;

/**
 * Every anchor form this gate has a disposition for.
 *
 * Closed on purpose. `classifyAnchorDeclaration` can return six forms; the corpus
 * currently authors five, and `artifact` (THR-1275) is authored by nothing yet. A test
 * that quietly skipped an unrecognised form would report green over exactly the new
 * class it was written to cover, so an unlisted form fails by name below.
 */
const EXPECTED_FORMS = [
  'actor',
  'target',
  'cast',
  'faction',
  'attachment_template',
  'artifact',
] as const;
type AnchorForm = (typeof EXPECTED_FORMS)[number];

/**
 * Forms whose referent is created by the encounter rather than found in the world.
 *
 * `artifact` resolves through the `sourceEncounterId` stamp `spawn_artifact` writes at
 * mint, so it can only resolve *after* an ending has been applied — there is nothing
 * for a pre-resolution gate to look up. It is listed rather than omitted so the closed
 * set above stays closed; if content ever authors one, the count assertion below is
 * where that shows up, not a silent skip.
 */
const MINT_BOUND_FORMS: ReadonlySet<AnchorForm> = new Set<AnchorForm>(['artifact']);

/**
 * Anchors that declare an `entityId` and no `visualKind`, and so never reach a resolver.
 *
 * **A finding, pinned rather than tolerated.** `EncounterAftermathConceptRef.visualKind`
 * gates both consumers — "Absent ⇒ neither is drawn" — so `fromConceptRef` returns
 * `undefined` and the chip renders as plain text carrying a `$actor` sentinel nothing
 * will ever read. That is not a dead link (Law 21 is satisfied: no affordance is drawn)
 * and it is not a violation `check:chip-anchors` is about (the declaration is
 * well-formed). It is an anchor authored into a field its own surface ignores.
 *
 * Enumerated by name, not counted, per the plan's *"enumerating expected drops
 * explicitly rather than tolerating a rate"*. A ceiling would let one of these be fixed
 * and a different one appear with the gate none the wiser. Filed as THR-1317; each id
 * leaves this list when its chip gains a `visualKind` or drops the `entityId`.
 */
const ANCHORS_WITHOUT_VISUAL_KIND: readonly string[] = [
  'encounter.border.toll_of_blades::toll.iron_tested::$actor',
  'encounter.delve.the_broken_seal::seal.crit_fail.the_wanting::$actor',
  'encounter.delve.the_drowned_archive::archive.cost.charter_known::$actor',
  'encounter.delve.the_drowned_archive::archive.crit.charter_known::$actor',
  'encounter.delve.the_drowned_archive::archive.crit_fail.one_line::$actor',
  'encounter.delve.the_drowned_archive::archive.fail.kept_name::$actor',
  'encounter.delve.the_drowned_archive::archive.success.charter_known::$actor',
];

/**
 * Faction definitions a chip anchors that this world spawned no chapter of.
 *
 * Empty on seed 42, and that emptiness is the assertion — all three definitions the
 * corpus names (`civic_guard`, `holy_order_dawn`, `mercenary_company`) are live here.
 * `classifyAnchorDeclaration` deliberately passes a definition that ships but spawns
 * nowhere, because that is a worldgen outcome rather than an authoring error; this list
 * is where such an outcome becomes visible instead of being absorbed as an acceptable
 * rate. A defId appearing here is not automatically a bug — it is a fact somebody has
 * to look at, which is the whole difference between an enumeration and a tolerance.
 */
const FACTION_DEFS_ABSENT_FROM_SEEDED_WORLD: readonly string[] = [];

interface StagedAnchor {
  readonly templateId: string;
  readonly changeId: string;
  readonly where: string;
  readonly entityId: string;
  readonly form: AnchorForm;
  readonly key: string;
}

function buildSeededWorld(): GameState {
  resetDecisionCache();
  resetEventCounter();
  const archetypes = generateArchetypes(4, SEED);
  const preset = MAP_SIZE_PRESETS.small;
  const { state: initial } = initializeGameState(
    archetypes[0],
    'NoOp-Gate',
    createBalancedCosmology(),
    SEED,
    preset.cols,
    preset.rows,
  );
  const runtime = createSimulationRuntime();
  let state = initial;
  for (let i = 0; i < NOOP_GATE_TICK_BUDGET; i++) state = runTick(state, [], runtime);
  return state;
}

/**
 * Whether a resolved id names something that is really there.
 *
 * Two id spaces, because the resolver legitimately returns from both: a sentinel
 * resolves to a per-world graph node, and an attachment-template literal passes through
 * unchanged to a node held in the template index, which is committed content and not in
 * the world graph at all. Checking only the graph would fail all 63 literals; checking
 * only the index would pass any string the graph never heard of. A `hex` id names
 * coordinates rather than a node and is validated by its own parser.
 */
function namesSomethingReal(graph: WorldGraph, kind: string, id: string): boolean {
  if (kind === 'hex') return parseHexRefId(id) !== undefined;
  return graph.getNode(id) !== undefined || getAttachmentTemplateNode(id) !== undefined;
}

describe('WorldRef no-op gate — declared chip anchors resolve in a seeded world', () => {
  const state = buildSeededWorld();
  const graph = state.graph;

  // Deterministic actor/target picks (NFP #3) — `getNodesByType` ordering is an
  // insertion detail, not a promise, so sort before taking.
  const agentIds = graph
    .getNodesByType('actor')
    .filter(node => node.properties.actorType === 'individual')
    .map(node => node.id)
    .sort();

  const templatesWithAnchors: UnifiedActionTemplate[] = UNIFIED_ACTION_TEMPLATES.filter(
    template => declaredChipAnchors(template).length > 0,
  );

  // Stage every anchor once, through the real binder. `prepareEncounterSupportBundle`
  // rather than a hand-built map is the whole point of the exercise: an invented map
  // would verify the fiction on both sides and could never have caught THR-1165.
  const staged: StagedAnchor[] = [];
  const castNodeIdByTemplate = new Map<string, ReadonlyMap<string, string>>();
  const unclassified: string[] = [];

  for (const template of templatesWithAnchors) {
    const supportKeys = new Set((template.supportBundle ?? []).map(spec => spec.key));
    const mintsArtifact = undefined; // "the caller cannot say" — see ClassifyAnchorOptions

    let bindings: ReadonlyMap<string, string> = new Map();
    try {
      bindings = new Map(
        prepareEncounterSupportBundle(state, template, agentIds[0]).map(binding => [
          binding.key,
          binding.nodeId,
        ]),
      );
    } catch {
      // NFP #4 — the binder failing is a finding the assertions below surface as an
      // unresolved cast anchor, not a reason this file cannot run.
      bindings = new Map();
    }
    castNodeIdByTemplate.set(template.id, bindings);

    for (const anchor of declaredChipAnchors(template)) {
      const entityId = anchor.ref.entityId;
      if (!entityId) continue;
      const verdict = classifyAnchorDeclaration(entityId, { supportKeys, mintsArtifact });
      if (!verdict.ok) {
        unclassified.push(`${template.id}::${anchor.changeId}::${entityId} — ${verdict.reason}`);
        continue;
      }
      staged.push({
        templateId: template.id,
        changeId: anchor.changeId,
        where: anchor.where,
        entityId,
        form: verdict.form,
        key: `${template.id}::${anchor.changeId}::${entityId}`,
      });
    }
  }

  const resolvableForms = staged.filter(anchor => !MINT_BOUND_FORMS.has(anchor.form));

  /** Resolve one staged anchor exactly as the encounter stage would. */
  function resolveStaged(anchor: StagedAnchor): string | undefined {
    const template = templatesWithAnchors.find(t => t.id === anchor.templateId);
    const ref = fromConceptRef(
      declaredChipAnchors(template!).find(
        candidate =>
          candidate.changeId === anchor.changeId && candidate.ref.entityId === anchor.entityId,
      )!.ref,
    );
    if (!ref) return undefined;
    return resolveWorldRef(ref, {
      graph,
      actorId: agentIds[0],
      targetId: agentIds[1],
      castNodeIdByKey: castNodeIdByTemplate.get(anchor.templateId),
      encounterTemplateId: anchor.templateId,
      surface: 'noop-gate',
      tick: state.tick,
    });
  }

  describe('population', () => {
    it('the seeded world is real — agents, factions and a run behind it', () => {
      expect(state.tick).toBeGreaterThanOrEqual(NOOP_GATE_TICK_BUDGET);
      expect(agentIds.length).toBeGreaterThan(1);
      expect(
        graph.getNodesByType('actor').filter(n => n.properties.actorType === 'faction').length,
      ).toBeGreaterThan(0);
    });

    it('the anchor population is non-empty', () => {
      expect(templatesWithAnchors.length).toBeGreaterThan(0);
      expect(staged.length).toBeGreaterThan(0);
    });

    it('every anchor in the corpus classifies — the gate never runs over an unreadable one', () => {
      expect(unclassified).toEqual([]);
    });

    it('every form present in the corpus has a disposition here', () => {
      const present = [...new Set(staged.map(anchor => anchor.form))].sort();
      const unlisted = present.filter(
        form => !(EXPECTED_FORMS as readonly string[]).includes(form),
      );
      expect(unlisted).toEqual([]);
    });

    // The guard that stops every "all X resolve" assertion below from passing over an
    // empty set. Asserted per form, because the corpus is lopsided — 63 literals
    // against 23 cast anchors — and a total-only guard is discharged by the literals
    // alone while the class that actually broke in THR-1165 sits at zero.
    it.each(
      EXPECTED_FORMS.filter(form => !MINT_BOUND_FORMS.has(form)),
    )('form %s is actually exercised', form => {
      expect(staged.filter(anchor => anchor.form === form).length).toBeGreaterThan(0);
    });
  });

  describe('resolution', { timeout: WORLD_SIM_TEST_TIMEOUT_MS }, () => {
    it('every declared anchor resolves to something that is really there', () => {
      const unresolved: string[] = [];
      for (const anchor of resolvableForms) {
        if (ANCHORS_WITHOUT_VISUAL_KIND.includes(anchor.key)) continue;
        if (
          anchor.form === 'faction'
          && FACTION_DEFS_ABSENT_FROM_SEEDED_WORLD.includes(
            anchor.entityId.slice(ANCHOR_SENTINEL_FACTION_PREFIX.length),
          )
        ) {
          continue;
        }
        const resolved = resolveStaged(anchor);
        if (!resolved) {
          unresolved.push(`${anchor.key} (${anchor.form}) on ${anchor.where} — resolved to nothing`);
          continue;
        }
        if (!namesSomethingReal(graph, anchor.form === 'faction' ? 'faction' : 'agent', resolved)) {
          unresolved.push(
            `${anchor.key} (${anchor.form}) on ${anchor.where} — resolved to '${resolved}', `
              + 'which is neither a node in this world nor a shipped template',
          );
        }
      }
      expect(unresolved).toEqual([]);
    });

    it('the anchors that never reach a resolver are exactly the enumerated ones', () => {
      const unreachable = staged
        .filter(anchor => {
          const template = templatesWithAnchors.find(t => t.id === anchor.templateId)!;
          const declaration = declaredChipAnchors(template).find(
            candidate =>
              candidate.changeId === anchor.changeId && candidate.ref.entityId === anchor.entityId,
          )!;
          return fromConceptRef(declaration.ref) === undefined;
        })
        .map(anchor => anchor.key)
        .sort();
      expect(unreachable).toEqual([...ANCHORS_WITHOUT_VISUAL_KIND].sort());
    });

    it('faction anchors reach a live chapter, and absences are enumerated not tolerated', () => {
      const factionAnchors = staged.filter(anchor => anchor.form === 'faction');
      const liveDefIds = new Set(
        graph
          .getNodesByType('actor')
          .filter(node => node.properties.actorType === 'faction')
          .map(node => node.properties.factionDefId as string),
      );
      const absent = [
        ...new Set(
          factionAnchors
            .map(anchor => anchor.entityId.slice(ANCHOR_SENTINEL_FACTION_PREFIX.length))
            .filter(defId => !liveDefIds.has(defId)),
        ),
      ].sort();
      expect(absent).toEqual([...FACTION_DEFS_ABSENT_FROM_SEEDED_WORLD].sort());
      // Non-vacuity: an empty absence list is only meaningful if some anchor resolved.
      expect(factionAnchors.length).toBeGreaterThan(0);
    });

    it('every cast anchor names a key the real binder actually produced (THR-1165)', () => {
      const castAnchors = staged.filter(anchor => anchor.form === 'cast');
      const unbound: string[] = [];
      for (const anchor of castAnchors) {
        const key = anchor.entityId.slice('$cast:'.length);
        const bound = castNodeIdByTemplate.get(anchor.templateId)?.get(key);
        if (!bound) {
          unbound.push(`${anchor.key} — supportBundle bound no '${key}' in a real world`);
          continue;
        }
        if (!namesSomethingReal(graph, 'agent', bound)) {
          unbound.push(`${anchor.key} — bound '${key}' to '${bound}', which is not in this world`);
        }
      }
      expect(unbound).toEqual([]);
      expect(castAnchors.length).toBeGreaterThan(0);
    });
  });

  describe('the gate can fail', () => {
    // A check that cannot fail proves nothing about the thing it checks. Slice 1 pinned
    // this at unit level on the resolver; it is re-pinned here on the *gate's own*
    // existence predicate, because that predicate is what every assertion above trusts.
    it('a well-typed reference to a node that is not there is rejected and logged', () => {
      clearWorldRefDrops();
      const hollow = 'actor_this_world_never_minted';
      expect(namesSomethingReal(graph, 'agent', hollow)).toBe(false);
      const resolved = resolveWorldRef(
        { kind: 'agent', id: hollow },
        { graph, surface: 'noop-gate-falsification' },
      );
      // The sentinel grammar passes a literal through unchanged, so the id comes back —
      // and the existence predicate above is the half that refuses it. That split is
      // the point: a resolver that guessed would launder exactly this case.
      expect(resolved).toBe(hollow);
      expect(namesSomethingReal(graph, 'agent', resolved!)).toBe(false);

      const dropped = resolveWorldRef(
        { kind: 'codex', id: 'anything' },
        { graph, surface: 'noop-gate-falsification' },
      );
      expect(dropped).toBeUndefined();
      expect(getWorldRefDrops().some(drop => drop.surface === 'noop-gate-falsification')).toBe(
        true,
      );
      clearWorldRefDrops();
    });
  });
});
