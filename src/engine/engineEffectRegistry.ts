/**
 * Engine Effect Registry (THR-604) — metadata-only aggregation of the template
 * ids whose mechanical effect is wired through an *engine bridge* rather than
 * through the template's own step GraphOps.
 *
 * Mechanical effects in this codebase live in three shapes: (a) step GraphOps on
 * the template itself, (b) a sustained `controlSpec`, and (c) id-keyed engine
 * bridges scattered across a handful of modules. Shapes (a) and (b) are readable
 * straight off the template. This registry is the single place that answers
 * "does an engine bridge implement this id?" for shape (c), so the action-catalog
 * generator can derive an honest `effectSource` classification.
 *
 * It aggregates the *existing* id lists from their owning modules (imported, never
 * re-declared here, so the registry can never drift from the resolvers):
 *   • `HEX_BRIDGE_TEMPLATE_IDS`      — hex tile mutations + static/dynamic GraphOps
 *   • `TEMPLATE_REVELATION_MAP`      — hex observation actions that reveal layers
 *   • `PERCEIVE_RELAY_TEMPLATE_IDS`  — Ruins-layer Perceive/Relay divine actions
 *   • `SELF_ACTION_TEMPLATE_IDS`     — divine.self.* self-buff post-processors
 *
 * NOTE (THR-996): `ENCHANT_TEMPLATE_ID` used to be listed here, on the premise that
 * an engine bridge advanced the artifact's tier. No bridge ever existed. THR-996
 * wired advancement as a step GraphOp (`advance_artifact_tier`) instead — the shape
 * the artifact-trio siblings already use — so `artifact.enchant` and the new
 * `artifact.empower` are shape (a), classified `template-ops` by `effectSourceFor`.
 * Leaving them here would be a stale claim about a bridge that does not exist.
 *
 * No node types, edge types, tick phases, or runtime behavior — this is a
 * build-time / inspection surface only (NFP #6: additive). A unit test asserts
 * every id here exists in `UNIFIED_ACTION_TEMPLATES` (see
 * engineEffectRegistry.test.ts) so a resolver renaming a template surfaces as a
 * red test rather than a silently-wrong catalog badge.
 */
import { HEX_BRIDGE_TEMPLATE_IDS } from './hexActionBridge';
import { TEMPLATE_REVELATION_MAP } from './revelationResolver';
import { PERCEIVE_RELAY_TEMPLATE_IDS } from './ruins/perceiveRelay';
import { SELF_ACTION_TEMPLATE_IDS } from './unifiedActionResolution';

/**
 * Union of every template id the engine bridges implement outside the template's
 * own step ops / controlSpec. Consumed by the generator's `effectSource`
 * derivation (the `engine-bridge` classifier).
 */
export const ENGINE_EFFECT_TEMPLATE_IDS: ReadonlySet<string> = new Set<string>([
  ...HEX_BRIDGE_TEMPLATE_IDS,
  ...Object.keys(TEMPLATE_REVELATION_MAP),
  ...PERCEIVE_RELAY_TEMPLATE_IDS,
  ...SELF_ACTION_TEMPLATE_IDS,
]);
