/**
 * Elements the browser will hand keyboard focus to. Named so widening the focus
 * contract is a change to this list, not to any consumer's logic (NFP #1).
 *
 * One definition, two readers with opposite intents:
 * - `Modal` *collects* matches — the controls Tab cycles through inside a trap (Law 50).
 * - `Tooltip` *detects* a match — whether its children already own a tab stop, so the
 *   trigger wrapper does not add a second one (THR-1095).
 *
 * Deliberately does not filter on visibility: `offsetParent` and `getClientRects()`
 * both read empty under jsdom, so a visibility filter would make both consumers
 * untestable rather than more correct.
 */
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');
