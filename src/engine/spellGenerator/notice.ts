/**
 * A transgression's notice — the one writer of a spell's `forbidden_contact` mark
 * (THR-1572, Lane decision 5).
 *
 * Plan: `Docs/plans/2026-09-30-thr-1572-seeded-spell-generator.md` § Resolution logic
 * (Notice). A generated transgression spell carries `notice` in its provenance; every cast
 * of it (landed or fizzled) and the first carrying of a fate-woven one place a hidden mark
 * on the caster, exactly as aftermath does, revealed through the ordinary reveal path
 * (`evaluateMarkReveals`). Kept apart from the library so the cast resolver imports this
 * and nothing of the generator.
 */

import type { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { HiddenMark } from '../../types/unifiedAction';
import type { SpellTemplate } from '../../types/effects';
import { emitTrace } from '../traceBuffer';
import { spellDefinitionNodeId } from '../../data/spell-templates';
import { SPELL_NOTICE_ONE_PER_SPELL } from '../../data/spell-generator-tables';
import type { GeneratedSpellProvenance } from './types';

/** The provenance on a spell's definition node, or undefined for an authored spell. */
export function spellProvenance(graph: WorldGraph, spellId: string): GeneratedSpellProvenance | undefined {
  const node = graph.getNode(spellDefinitionNodeId(spellId));
  return node?.properties.origin === 'generated' ? node.properties.generated as GeneratedSpellProvenance : undefined;
}

/** The deterministic id of a caster's notice mark for one spell. */
export function spellNoticeMarkId(casterId: string, spellId: string): string {
  return `spell_notice:${casterId}:${spellId}`;
}

/**
 * Place a transgression's notice — a `forbidden_contact` hidden mark on the caster — once
 * per caster per spell (`SPELL_NOTICE_ONE_PER_SPELL`). Returns the mark placed, or null
 * when the spell carries no notice or the caster already bears this spell's mark.
 */
export function placeSpellNotice(
  state: Partial<Pick<GameState, 'graph'>> & { hiddenMarks?: HiddenMark[] },
  casterId: string,
  spell: Pick<SpellTemplate, 'id' | 'name'>,
  tick: number,
  site: 'cast' | 'carried',
  /** The world to read the spell's provenance from, when the state does not carry it. */
  graph?: WorldGraph,
  /** THR-1672 — the god who taught this caster the spell; the mark then names the teaching. */
  taughtBy?: string,
): HiddenMark | null {
  try {
    const world = graph ?? state.graph;
    if (!world) return null;
    const notice = spellProvenance(world, spell.id)?.notice;
    if (!notice || notice.revealFamilies.length === 0) return null;
    const markId = spellNoticeMarkId(casterId, spell.id);
    const marks = state.hiddenMarks ?? [];
    if (SPELL_NOTICE_ONE_PER_SPELL && marks.some(m => m.markId === markId)) return null;
    const mark: HiddenMark = {
      markId,
      category: 'forbidden_contact',
      severity: notice.severity,
      label: taughtBy
        ? `${spell.name} was cast — ${world.getNode(taughtBy)?.name ?? 'a god'}'s teaching`
        : `${spell.name} was cast`,
      sourceEncounterId: `spell:${spell.id}`,
      placedTick: tick,
      targetAgentId: casterId,
      revealFamilies: [...notice.revealFamilies],
    };
    state.hiddenMarks = [...marks, mark];
    traceSafe({
      category: 'spell.notice_placed', tick, agentId: casterId, casterId, spellId: spell.id, markId,
      severity: notice.severity, site,
      summary: `${spell.name} is the kind of magic people notice: a mark is placed on ${casterId}`,
    });
    return mark;
  } catch {
    return null;
  }
}

function traceSafe(entry: Record<string, unknown>): void {
  try {
    emitTrace(entry as Parameters<typeof emitTrace>[0]);
  } catch {
    /* NFP #4 */
  }
}

/**
 * Place the notice marks of every fate-woven transgression spell a mortal carries at
 * world start (`site: 'carried'`). Seeding draws a library's lowest tier, so on a normal
 * world this places none; it exists so a retune that seeds a carried transgression is
 * noticed rather than silently free. Fail-soft: a throw places nothing.
 */
export function placeSeededCarriedNotices(state: Pick<GameState, 'graph' | 'tick'> & { hiddenMarks?: HiddenMark[] }): number {
  let placed = 0;
  try {
    const graph: WorldGraph = state.graph;
    const actors = graph.getNodesByType('actor').map(n => n.id).sort();
    for (const actorId of actors) {
      for (const edge of graph.getOutgoingEdges(actorId, 'has_trait')) {
        const node = graph.getNode(edge.target);
        if (node?.properties.origin !== 'generated' || node.properties.agency !== 'fate_woven') continue;
        const template = node.properties.template as Pick<SpellTemplate, 'id' | 'name'> | undefined;
        if (template && placeSpellNotice(state, actorId, template, state.tick ?? 0, 'carried')) placed++;
      }
    }
  } catch {
    /* NFP #4 */
  }
  return placed;
}
