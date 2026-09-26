/**
 * Cast receipt — the dispatch-time toast and chronicle sentence a player reads the
 * instant they play a card on a target (THR-1603).
 *
 * The receipt used to read "Mind — Action Invoked. reaches into the sleeping mind":
 * the sphere as title, and the template's `initiation` predicate appended with no
 * subject, no card name and no target. `initiation` is authored as a bare
 * third-person predicate ("reaches into the sleeping mind"), so it needs a subject
 * supplied here — the cast card itself, set on a named target by the player.
 *
 * Pure: the hook resolves names from the graph and passes plain strings in.
 */

import type { UnifiedActionTemplate } from '../../../types/unifiedAction';

/** Word used when the target cannot be resolved to a name. */
export const CAST_RECEIPT_UNNAMED_TARGET = 'your target';

/** Sentence used when a template authors neither an initiation nor a success line. */
export const CAST_RECEIPT_FALLBACK_EFFECT = 'the action ripples outward';

export interface CastReceipt {
  /** The card's player-facing name (Law 14: `spellName` where one exists). */
  readonly title: string;
  /** A full sentence: the player as subject, the target named. */
  readonly body: string;
  /** `title. body` — the single string the toast and the chronicle both carry. */
  readonly message: string;
}

type ReceiptTemplate = Pick<UnifiedActionTemplate, 'name' | 'spellName' | 'narrativeTemplates' | 'consequenceMessage'>;

function trimSentence(text: string): string {
  return text.trim().replace(/[.\s]+$/, '');
}

function capitalize(text: string): string {
  return text.length > 0 ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

/**
 * Build the receipt for a player cast.
 *
 * @param template   the cast template
 * @param targetName the target's display name; `null` when it is the caster, `undefined` when unresolved
 */
export function buildCastReceipt(template: ReceiptTemplate, targetName: string | null | undefined): CastReceipt {
  const title = template.spellName ?? template.name;
  const target = targetName === null ? 'yourself' : (targetName?.trim() || CAST_RECEIPT_UNNAMED_TARGET);

  const initiation = template.narrativeTemplates?.initiation;
  let body: string;
  if (initiation && trimSentence(initiation)) {
    // `initiation` is a bare predicate — "it" (the card) is its subject.
    body = `You set it upon ${target}: it ${trimSentence(initiation)}.`;
  } else {
    const effect = template.consequenceMessage?.success
      ? trimSentence(template.consequenceMessage.success)
      : CAST_RECEIPT_FALLBACK_EFFECT;
    body = `You set it upon ${target}. ${capitalize(effect)}.`;
  }

  return { title, body, message: `${title}. ${body}` };
}
