/**
 * Condition → `damaged` / `healed` proxy (THR-1244, stage 6 of the
 * effect-vocabulary activation program).
 *
 * ─── Why a proxy at all ─────────────────────────────────────────────
 * The `EffectEvent` union has carried `damaged` and `healed` since the primitive
 * architecture landed, and three separate trigger families read them — the
 * `damaged`/`healed` reactive triggers, the `on_damaged`/`on_heal` stack
 * triggers, and the `take_damage` expiry event. None of them could ever fire,
 * because nothing raised either event: **this game has no per-agent damage
 * model**, so there was no hit-point subtraction to hang the raise on, and the
 * whole branch sat inert behind an absent number.
 *
 * The decision (made in the plan doc, not here) is that the game already has a
 * word for being hurt and it is not an integer — it is a *condition*. A wound is
 * a `has_trait` edge with a countdown, and recovering from it is that countdown
 * running out (see `conditionDecay.ts`, which is where `healing_multiplier`
 * became meaningful for exactly this reason). So:
 *
 *   `damaged` — a harmful condition is inflicted on a person.
 *   `healed`  — a harmful condition is lifted from a person **early**.
 *
 * ─── "Early" is the load-bearing half ───────────────────────────────
 * `healed` fires only from a deliberate removal, never from natural expiry.
 * That is not enforced with a check; it is enforced by *where the raise lives*.
 * `decayConditions` is the one tick-driven expiry path (THR-761) and this module
 * is not called from it, so a condition that simply runs out its clock raises
 * nothing — which is the correct reading. Waiting out a wound is not being
 * healed, and a ward that fires "when you are healed" should not fire on every
 * agent in the world every time a bruise times out. A test in this module's
 * suite lets a condition expire naturally and asserts silence, because the
 * absence is the behaviour and an absence no test names is an absence nobody
 * will preserve.
 *
 * ─── What counts as harmful ─────────────────────────────────────────
 * The `#negative` tag on the condition's trait definition. The plan doc wrote
 * this as "the wound/disease/curse subfamily", but no such subfamily field
 * exists — every condition in `CONDITION_TRAIT_DEFINITIONS` carries exactly one
 * of `#negative` / `#positive`, personal and location conditions alike, and that
 * tag is the vocabulary the content actually has. Reading the real tag rather
 * than inventing the named-but-absent field is the difference between a live
 * predicate and one more phantom property with no writer.
 *
 * Polarity matters in both directions: lifting `blessed` is not a heal, so
 * `healed` is gated on the *removed* condition having been harmful, not merely
 * on something having been removed.
 *
 * **The vocabulary now spans every condition catalog in the repo (THR-1257).** It
 * used to cover only `CONDITION_TRAIT_DEFINITIONS` — the one catalog the three
 * aftermath sites draw from — while `anomaly-reward-catalog.ts`,
 * `starter-attachments.ts`, `reward-attachment-catalog.ts` and
 * `economic-trait-content.ts` tagged topically (`#cursed`, `#curse`, `#pain`,
 * `#wound`, `#blessing`) with no polarity at all, so `anomaly_vault_curse` read here
 * as *not harm*. That was inert while `actionTriggerPayloads` raised nothing; wiring
 * that site without reconciling the vocabularies would have turned an honest absence
 * into a live-but-silently-wrong classification, which is why the two shipped
 * together. 47 conditions were normalised onto `#negative` / `#positive`, and
 * `conditionPolarityCoverage.test.ts` fails if a new one ships without a polarity —
 * the predicate can only stay complete if the closure is enforced rather than
 * remembered.
 *
 * Note the reachable set is wider than the *grant* payloads suggest: `condition_remove`
 * matches on **tags** (`tags: ['#wound']`), so a single authored removal reaches every
 * `#wound` condition in the repo, `reward-attachment-catalog.ts` included. Normalising
 * only the catalogs the grants name would have left the healing half half-blind.
 *
 * ─── Constants ──────────────────────────────────────────────────────
 * | Name                          | Default | Purpose                          |
 * |-------------------------------|---------|----------------------------------|
 * | HARMFUL_CONDITION_TAG         | #negative | Tag marking a condition as harm |
 * | CONDITION_DAMAGED_PRIME       | 109     | PRNG stream separation (NFP #3)  |
 * | CONDITION_HEALED_PRIME        | 127     | PRNG stream separation (NFP #3)  |
 *
 * ─── Fail-soft (NFP #4) ─────────────────────────────────────────────
 * | Failure case                        | Fallback                          |
 * |-------------------------------------|-----------------------------------|
 * | Carrier is a place / faction / army | No raise, no trace                |
 * | Condition trait node missing        | Not harmful → no raise            |
 * | Condition carries no `#negative`    | No raise                          |
 * | Anything throws                     | Swallowed by `raiseEffectEvent`   |
 *
 * Plan doc: Docs/plans/2026-08-25-effect-vocabulary-activation.md
 */

import type { GameState } from '../../types/gameState';
import type { EffectRuntimeState } from '../../types/effects';
import type { WorldGraph } from '../graph';
import { mulberry32 } from '../../lib/prng';
import { raiseEffectEvent } from './effectEventDispatch';

/**
 * Options for a caller threading its own runtime-state map instead of letting
 * `raiseEffectEvent` own `state.effectStates` (THR-1257).
 *
 * Only the action-trigger path needs this today: its orchestrator call sits inside
 * the `runningEffectStates` loop, whose end-of-tick assignment would otherwise
 * overwrite anything this raise wrote. The three aftermath sites do not thread and
 * pass nothing, which is why the parameter is optional rather than required.
 */
export interface ConditionProxyOptions {
  states?: ReadonlyMap<string, EffectRuntimeState>;
}

// ═══════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════

/** Tag on a condition's trait definition marking it as harm rather than boon. */
export const HARMFUL_CONDITION_TAG = '#negative';

/**
 * Distinct PRNG primes so a condition raise's rolls cannot correlate with the
 * movement (47), encounter (43) or battle (103/107) streams. Only
 * `transform.probability` consumes the stream at all.
 */
const CONDITION_DAMAGED_PRIME = 109;
const CONDITION_HEALED_PRIME = 127;

/**
 * `actorType` values that can be damaged or healed.
 *
 * Persons only — deliberately excluding `group` (an army), `faction`, `culture`
 * and `god`. An army is an `actor` node carrying a headcount, not a body: it has
 * no attachments to react and no wound to bind, and `battleResolution` already
 * resolves army-scale harm to the two commanders for exactly this reason. A
 * place carrying a plague scare is not a person being hurt either. Raising for
 * those carriers would emit an `effect.event_raised` trace with zero reactives
 * on every location condition in the world, which is trace spam wearing the
 * costume of coverage.
 */
const PERSON_ACTOR_TYPES: ReadonlySet<string> = new Set(['individual', 'ascendant']);

// ═══════════════════════════════════════════════════════════════════
// Predicates
// ═══════════════════════════════════════════════════════════════════

/**
 * Is this condition harmful — i.e. does its trait definition carry `#negative`?
 *
 * Fail-soft: a missing node, a missing `tags` array, or a tag list without the
 * marker all read as "not harmful". The polarity is deliberate — an unknown
 * condition raising `damaged` would let any future trait silently start firing
 * combat reactives, whereas an unknown condition raising nothing is merely
 * inert and visible as such.
 */
export function isHarmfulCondition(graph: WorldGraph, conditionTraitId: string): boolean {
  const tags = graph.getNode(conditionTraitId)?.properties?.tags;
  return Array.isArray(tags) && tags.includes(HARMFUL_CONDITION_TAG);
}

/**
 * Is this carrier a person — someone who can be hurt and healed?
 *
 * Reads the graph rather than the aftermath effect's `target.kind`, on the same
 * argument `isLocationCarrier` makes in `encounterAftermath`: an effect can
 * reach a carrier through the actor fallback as well as through an explicit
 * target field, so the node is the authority on what it is.
 */
export function isPersonCarrier(graph: WorldGraph, carrierId: string): boolean {
  const node = graph.getNode(carrierId);
  if (!node || node.type !== 'actor') return false;
  const actorType = node.properties?.actorType;
  return typeof actorType === 'string' && PERSON_ACTOR_TYPES.has(actorType);
}

// ═══════════════════════════════════════════════════════════════════
// Raises
// ═══════════════════════════════════════════════════════════════════

/**
 * Shared body for both raises — one gate, one seeded stream, one call.
 *
 * `raiseEffectEvent` is the whole dispatch sequence named once (THR-1239), which
 * is what makes a new producer one line instead of a thirty-five-line paste. Its
 * own header predicted this module as "the next producer (conditions, in stage
 * 6)"; this is that producer taking it up on the offer.
 */
function raiseConditionProxy(
  state: GameState,
  carrierId: string,
  conditionTraitId: string,
  amount: number,
  kind: 'damaged' | 'healed',
  opts?: ConditionProxyOptions,
): Map<string, EffectRuntimeState> | undefined {
  if (!isPersonCarrier(state.graph, carrierId)) return undefined;
  if (!isHarmfulCondition(state.graph, conditionTraitId)) return undefined;

  const prime = kind === 'damaged' ? CONDITION_DAMAGED_PRIME : CONDITION_HEALED_PRIME;
  const raised = raiseEffectEvent(
    state,
    carrierId,
    { type: kind, amount },
    {
      site: kind === 'damaged' ? 'condition_inflicted' : 'condition_lifted',
      rng: mulberry32((state.seed + state.tick * prime + hashCarrier(carrierId)) >>> 0),
      ...(opts?.states ? { states: opts.states } : {}),
    },
  );
  // Only meaningful to a threading caller — without `opts.states`, `raiseEffectEvent`
  // has already assigned `state.effectStates` and the return is redundant.
  return opts?.states ? raised.states : undefined;
}

/**
 * Raise `damaged` for a harmful condition just inflicted on a person.
 *
 * `amount` is the condition's intensity (×stacks where the site applies more
 * than one). Intensity is the only magnitude a condition actually carries, so it
 * is the honest number to hand a reactive that asks "how badly?" — inventing a
 * hit-point figure here would put back the damage model whose absence is the
 * reason this proxy exists.
 *
 * Call **after** the `has_trait` edge is written, so a reactive that inspects the
 * bearer sees the condition it is reacting to.
 */
export function raiseConditionDamaged(
  state: GameState,
  carrierId: string,
  conditionTraitId: string,
  amount: number,
  opts?: ConditionProxyOptions,
): Map<string, EffectRuntimeState> | undefined {
  return raiseConditionProxy(state, carrierId, conditionTraitId, amount, 'damaged', opts);
}

/**
 * Raise `healed` for a harmful condition lifted from a person before its clock
 * ran out.
 *
 * Only ever called from a deliberate-removal site. See the "Early" note in the
 * module header for why natural expiry deliberately raises nothing.
 *
 * Call **after** the edge is removed, so a reactive that re-inspects the bearer
 * sees them already clear of it.
 */
export function raiseConditionHealed(
  state: GameState,
  carrierId: string,
  conditionTraitId: string,
  amount: number,
  opts?: ConditionProxyOptions,
): Map<string, EffectRuntimeState> | undefined {
  return raiseConditionProxy(state, carrierId, conditionTraitId, amount, 'healed', opts);
}

/**
 * Local string hash for stream separation — the same FNV-shaped idiom the other
 * producers carry locally (`phaseMovement`, `battleResolution`). Kept local for
 * the same reason they do: importing it would couple the effect subsystem to
 * `factionAmbitions` for four lines of arithmetic.
 */
function hashCarrier(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h << 5) - h + id.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
