/**
 * THR-2103 (art-led pass, slice 7) — what the open list surfaces drew, read off their DOM.
 *
 * Backs `window.__DEBUG.getListDressing()`. Reports what was drawn, never why: each surface's
 * rows that name a person, place, faction, army or relic (`data-row-subject`), those that drew
 * no picture (`data-row-art="none"`), and its heading shapes (`data-heading-icon`). A surface
 * that is not open is left out, so nothing open reads `[]`.
 */
import type { DebugListDressing } from '../../debug-bridge.d';

/** Each surface and the test id its root already carries. */
const LIST_SURFACES: readonly { surface: DebugListDressing['surface']; selector: string }[] = [
  { surface: 'chronicle', selector: '[data-testid="chronicle-panel"]' },
  { surface: 'notables', selector: '[data-testid="notables-panel"]' },
  { surface: 'rivals', selector: '[data-testid="rival-panel"]' },
  { surface: 'threads', selector: '[data-testid="threads-panel"]' },
  { surface: 'read-the-threads', selector: '[role="dialog"]:has([data-testid="read-the-threads"])' },
  { surface: 'omens', selector: '[data-testid="omen-detail"]' },
  { surface: 'toasts', selector: '[data-testid="toast-stack"]' },
  { surface: 'find', selector: '[data-testid="find-box"]' },
  { surface: 'hover-card', selector: '[data-testid="hover-card"]' },
];

function rootOf(doc: Document, selector: string): Element | null {
  try {
    return doc.querySelector(selector);
  } catch {
    // `:has()` unsupported: fall back to the heading's own dialog.
    return doc.querySelector('[data-testid="read-the-threads"]')?.closest('[role="dialog"]') ?? null;
  }
}

/** Every open list surface's dressing; `[]` when none is open. */
export function readListDressing(doc: Document = document): DebugListDressing[] {
  const out: DebugListDressing[] = [];
  for (const { surface, selector } of LIST_SURFACES) {
    const root = rootOf(doc, selector);
    if (!root) continue;
    // A toast stack with no toast, or an unread digest, is not an open list.
    if (surface === 'toasts' && !root.querySelector('[data-testid="toast"]')) continue;
    const rows = [...root.querySelectorAll('[data-row-subject]')];
    if (root.hasAttribute('data-row-subject')) rows.unshift(root);
    out.push({
      surface,
      subjectRows: rows.length,
      subjectRowsBare: rows.filter(el => el.getAttribute('data-row-art') === 'none').length,
      headingIcons: [...root.querySelectorAll('[data-heading-icon]')]
        .map(el => el.getAttribute('data-heading-icon') ?? '')
        .filter(Boolean),
    });
  }
  return out;
}
