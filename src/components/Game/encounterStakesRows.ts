/**
 * The stakes line on the surfaces that name a story at a glance — THR-1727.
 *
 * The encounter badge and the agent thread row both read the same line the veil
 * opens with, and the same result line the Chapter Ledger closes with, so a story
 * is called one thing everywhere (Law 55). Pure selectors over `GameState`; the
 * lines themselves are built by `src/engine/encounters/stakesLine.ts` and the
 * chapter archive.
 */

import type { GameState } from '../../types/gameState';
import type { EncounterNotification } from '../../types/encounterVisibility';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { rememberedStakesLine, stakesLineForAction } from '../../engine/encounters/stakesLine';
import { isEncounterAction } from '../../engine/chapterArchive';

/** One thread row's story line, and which half of the story it is. */
export interface EncounterStakesRowLine {
  readonly text: string;
  /** `stakes` while the encounter runs; `result` once it has resolved. */
  readonly kind: 'stakes' | 'result';
}

/**
 * The line a notification's encounter is named by: the opening stakes line for a
 * live beat, the result line for a concluded one. `undefined` when the encounter
 * authors no stakes (the badge keeps its template name alone).
 */
export function stakesLineForNotification(
  gameState: GameState,
  notif: EncounterNotification,
): string | undefined {
  if (!notif.actionId) return undefined;
  try {
    const action = gameState.unifiedActions.find(a => a.actionId === notif.actionId);
    if (action) {
      const template = getUnifiedTemplateById(action.templateId);
      if (!template) return undefined;
      return rememberedStakesLine(action, template, gameState.graph) ?? undefined;
    }
    // The action was pruned; the chapter remembers it.
    return gameState.chapterArchive?.find(r => r.actionId === notif.actionId)?.stakesLine;
  } catch {
    return undefined;
  }
}

/**
 * Per agent: the live encounter's opening stakes line, else the most recently
 * resolved chapter's result line. Agents whose encounters author no stakes are
 * absent from the map, so their rows draw nothing (never a placeholder, Law 4).
 */
export function selectEncounterStakesLines(
  gameState: Pick<GameState, 'unifiedActions' | 'chapterArchive' | 'graph'>,
  agentIds: Iterable<string>,
): Map<string, EncounterStakesRowLine> {
  const wanted = new Set(agentIds);
  const out = new Map<string, EncounterStakesRowLine>();
  if (wanted.size === 0) return out;
  // An agent is decided by its newest story, whether or not that story authors
  // stakes: a newer encounter without a line must not let an older line through.
  const decided = new Set<string>();

  for (const action of gameState.unifiedActions ?? []) {
    if (action.resolved || !wanted.has(action.actorId) || decided.has(action.actorId)) continue;
    try {
      const template = getUnifiedTemplateById(action.templateId);
      if (!template || !isEncounterAction(action.templateId)) continue;
      decided.add(action.actorId);
      const line = stakesLineForAction(action, template, gameState.graph);
      if (line) out.set(action.actorId, { text: line.text, kind: 'stakes' });
    } catch {
      // A row without its line is better than a row that throws (NFP #4).
    }
  }

  // Newest resolved chapter per remaining agent. The archive is append-ordered,
  // so walking it backwards meets each agent's latest chapter first.
  const archive = gameState.chapterArchive ?? [];
  for (let i = archive.length - 1; i >= 0; i--) {
    const record = archive[i];
    if (!wanted.has(record.actorId) || decided.has(record.actorId)) continue;
    decided.add(record.actorId);
    if (record.stakesLine) out.set(record.actorId, { text: record.stakesLine, kind: 'result' });
  }
  return out;
}
