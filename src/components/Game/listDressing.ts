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
      ...readRowName(root),
    });
  }
  return out;
}

/** A box edge drawn on any side (THR-2120 § 3 counting). */
function isBordered(el: Element): boolean {
  try {
    const cs = getComputedStyle(el);
    return ['top', 'right', 'bottom', 'left'].some(side => {
      const style = cs.getPropertyValue(`border-${side}-style`);
      const width = parseFloat(cs.getPropertyValue(`border-${side}-width`)) || 0;
      return style !== '' && style !== 'none' && style !== 'hidden' && width > 0;
    });
  } catch {
    return false;
  }
}

/**
 * THR-2125 R5 — the surface's first row name (`[data-row-name]`): its face, size, weight and
 * whether it is cut (`scrollWidth > clientWidth`); and `frameDepth`, the bordered boxes from
 * that row up to and including the surface root, the row's own border counted. No row →
 * `rowName: null`, `frameDepth: 0`, never a throw.
 */
export function readRowName(root: Element): Pick<DebugListDressing, 'rowName' | 'frameDepth'> {
  const el = root.matches('[data-row-name]') ? root : root.querySelector('[data-row-name]');
  if (!el) return { rowName: null, frameDepth: 0 };
  let family = '';
  let sizePx = 0;
  let weight = 0;
  try {
    const cs = getComputedStyle(el);
    family = cs.fontFamily || (el as HTMLElement).style?.fontFamily || '';
    sizePx = parseFloat(cs.fontSize) || 0;
    weight = parseInt(cs.fontWeight, 10) || 0;
  } catch {
    // fail-soft: an unreadable style reads as zeros
  }
  const html = el as HTMLElement;
  const clipped = (html.scrollWidth ?? 0) > (html.clientWidth ?? 0);
  let frameDepth = 0;
  for (let node: Element | null = el; node; node = node.parentElement) {
    if (isBordered(node)) frameDepth++;
    if (node === root) break;
  }
  return { rowName: { family, sizePx, weight, clipped }, frameDepth };
}
