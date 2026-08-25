/**
 * Consumable charges — spend a charge when the bearer uses the item.
 *
 * THR-1239. `consumable_charge` declares `charges`, an `onUse` reach/value, and
 * `destroyOnEmpty`. The tick handler initialises `chargesRemaining` on the first
 * tick and destroys the attachment once it reaches 0 — but **nothing ever
 * decremented it**, so the destroy branch was unreachable and every "3 charges"
 * item in the reward catalogs was, in play, unlimited. This module is the
 * missing decrement.
 *
 * ─── When a charge is spent ─────────────────────────────────────────
 * One charge per completed encounter step whose reach matches the charge's
 * `onUse.reach`. That is the moment the item's bonus is actually claimed:
 * `effectResolver` returns 0 for `consumable_charge` passively, so the value only
 * ever reaches a roll through the on-use path.
 *
 * Spending is **automatic**. An agent's gear has no player-facing "use item"
 * verb, so a charge gated behind an explicit opt-in would never be spent by
 * anyone but the avatar — which is how it stayed at zero for the whole catalog.
 *
 * ─── Fail-soft (NFP #4) ─────────────────────────────────────────────
 * | Failure case                          | Fallback                        |
 * |---------------------------------------|---------------------------------|
 * | Bearer node missing                   | No-op, states returned unchanged|
 * | `chargesRemaining` unset              | Initialise from `effect.charges`|
 * | Already at 0                          | Clamp — never negative, no trace|
 * | Empty and `destroyOnEmpty: false`     | Stays attached at 0, inert      |
 * | Graph removal throws                  | Swallowed; state still updated  |
 *
 * Plan doc: Docs/plans/2026-08-25-effect-vocabulary-activation.md
 */

import type { WorldGraph } from '../graph';
import type { EffectRuntimeState } from '../../types/effects';
import type { ReachDomain } from '../../types/traits';
import type { TraceEntry } from '../../types/trace';
import { collectAttachmentEffects } from './effectWalker';
import { emitTrace } from '../traceBuffer';
import { CONSUMABLE_CHARGE_SPEND_PER_STEP } from '../../data/effect-constants';

export interface ChargeSpendResult {
  /** Merged runtime states — copy-then-assign, never the map that was passed in. */
  updatedStates: Map<string, EffectRuntimeState>;
  /** Attachments emptied with `destroyOnEmpty` — already removed from the graph. */
  destroyedAttachments: string[];
  /** How many charges were spent across all of the bearer's attachments. */
  spent: number;
}

/**
 * Spend one charge on every `consumable_charge` attachment whose `onUse.reach`
 * matches the reach of the step the bearer just completed.
 *
 * Emits one `effect.charge_spent` trace per spend and removes any attachment the
 * spend emptied when it declares `destroyOnEmpty`.
 *
 * @param graph     - World graph (mutated only to remove emptied attachments)
 * @param agentId   - Bearer who completed the step
 * @param reach     - Reach of the completed step
 * @param effectStates - Current per-attachment runtime states
 * @param tick      - Current tick, for the trace
 */
export function spendConsumableCharges(
  graph: WorldGraph,
  agentId: string,
  reach: ReachDomain,
  effectStates: ReadonlyMap<string, EffectRuntimeState>,
  tick: number,
): ChargeSpendResult {
  const updatedStates = new Map(effectStates);
  const destroyedAttachments: string[] = [];
  let spent = 0;

  if (!graph.getNode(agentId)) return { updatedStates, destroyedAttachments, spent };

  for (const entry of collectAttachmentEffects(graph, agentId, updatedStates)) {
    const { attachmentId, attachmentName, effect, runtimeState } = entry;
    if (effect.type !== 'consumable_charge') continue;
    if (effect.onUse.reach !== reach) continue;
    // A suppressed attachment contributes nothing, so it is not being used.
    if (runtimeState?.suppressed) continue;

    // The tick handler initialises this too, but a step can resolve before an
    // attachment's first effect tick — read through to the declared charge count
    // rather than treating `undefined` as empty.
    const before = runtimeState?.chargesRemaining ?? effect.charges;
    if (before <= 0) continue;

    const after = Math.max(0, before - CONSUMABLE_CHARGE_SPEND_PER_STEP);
    const current = updatedStates.get(attachmentId) ?? {};
    updatedStates.set(attachmentId, { ...current, chargesRemaining: after });
    spent++;

    const destroyed = after <= 0 && effect.destroyOnEmpty;
    if (destroyed) {
      // Mirrors applyEffectEventResult: drop the edges, then the node.
      try {
        for (const edge of graph.getIncomingEdges(attachmentId)) {
          try { graph.removeEdge(edge.id); } catch { /* already removed */ }
        }
        graph.removeNode(attachmentId);
      } catch {
        /* fail-soft: an already-removed attachment is not an error */
      }
      destroyedAttachments.push(attachmentId);
    }

    emitTrace({
      category: 'effect.charge_spent',
      tick,
      agentId,
      attachmentId,
      attachmentName,
      reach,
      chargesRemaining: after,
      destroyed,
      summary: `${attachmentName} spent a ${reach} charge (${after} left)${destroyed ? ' — and was used up' : ''}`,
    } as TraceEntry);
  }

  return { updatedStates, destroyedAttachments, spent };
}
