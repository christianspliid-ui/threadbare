/**
 * Assembling an {@link EncounterBinderContext} from a live session — THR-1305.
 *
 * The context is a narrow struct by design (see its own doc comment): the census and
 * the index live on the runtime, the ledger lives on the state, and
 * `encounterSupportBundle` deliberately imports neither. Somebody therefore has to put
 * the three together, and until this module that somebody was `phaseAgentDecision` —
 * inline, at the one call site that had all three to hand.
 *
 * That was fine while the live decision path was the only caller. It stops being fine
 * the moment the debug tools and the CLI need the same context, because the rule the
 * assembly encodes is not obvious and is easy to get subtly wrong:
 *
 * **Both the runtime and `strategicState` must exist, or there is no context at all.**
 *
 * The `strategicState` half is the one that invites a bug. {@link getBindings} tolerates
 * an absent strategic state by returning `[]` (NFP #4/#6), so an assembler that skipped
 * the check would still produce a well-typed context — one whose `bindings` array is a
 * fresh local that nothing owns. Registrations would land in it, the call would report a
 * successful bind, and the rows would be dropped on return. A silent write to nowhere is
 * strictly worse than the legacy path, which at least binds honestly without a ledger.
 *
 * Returning `undefined` instead routes the caller to the legacy path — the same
 * fail-soft the opt-in gate in `prepareEncounterSupportBundle` already implements.
 */
import type { GameState } from '../../types/gameState';
import type { SimulationRuntime } from '../simulationRuntime';
import { ensureRoleCensus } from '../simulationRuntime';
import { getBindings } from './bindingRegistry';
import type { EncounterBinderContext } from '../encounterSupportBundle';

/**
 * Build the scored-binder context, or `undefined` when this session cannot ledger.
 *
 * @param runtime The session runtime. Nullable because two of the three call sites are
 *   debug entry points that may be reached before a runtime exists.
 * @param state Supplies the graph (for the census) and the binding ledger.
 * @param actorId The agent walking into the encounter, when there is one. Absent at the
 *   context-spawn site, which stages an encounter with no agent yet chosen; the tie term
 *   then reads 0 uniformly rather than favouring anyone.
 */
export function buildEncounterBinderContext(
  runtime: SimulationRuntime | null | undefined,
  state: GameState,
  actorId?: string,
): EncounterBinderContext | undefined {
  if (!runtime || !state.strategicState) return undefined;
  return {
    census: ensureRoleCensus(runtime, state.graph),
    index: runtime.bindingIndex,
    // `getBindings` owns the lazy-init of the ledger array; the field is optional on
    // `StrategicRuntimeState` and a second initializer here would be a second place for
    // that rule to live.
    bindings: getBindings(state.strategicState),
    actorId,
  };
}
