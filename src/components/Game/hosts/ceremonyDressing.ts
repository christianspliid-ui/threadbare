/**
 * THR-2102 (art-led pass, slice 6) — what the open ceremony drew, read off its DOM.
 *
 * Backs `window.__DEBUG.getCeremonyDressing()`. Reports what was drawn, never why: every face
 * (`data-ceremony-face` + `data-ceremony-face-role`), every heading shape
 * (`data-ceremony-heading-icon`), and on the harvest its echo cards and the leave-chip row.
 */
import type { DebugCeremonyDressing } from '../../../debug-bridge.d';

function findRoot(doc: Document): { kind: DebugCeremonyDressing['kind']; root: Element } | null {
  // The rite: the full rite's surface, or the bond-only card (a dialog) around its face.
  const rite = doc.querySelector('[data-testid="threading-rite"]')
    ?? doc.querySelector('[data-ceremony-face-role="rite"]')?.closest('[role="dialog"]')
    ?? doc.querySelector('[data-ceremony-face-role="rite"]')?.parentElement
    ?? null;
  if (rite) return { kind: 'threading-rite', root: rite };
  const harvest = doc.querySelector('[data-testid="cycle-harvest"]');
  if (harvest) return { kind: 'cycle-harvest', root: harvest };
  const twilight = doc.querySelector('[data-testid="age-twilight"]');
  if (twilight) return { kind: 'age-twilight', root: twilight };
  return null;
}

/** The open ceremony's dressing, or null when none is open. */
export function readCeremonyDressing(doc: Document = document): DebugCeremonyDressing | null {
  const found = findRoot(doc);
  if (!found) return null;
  const { kind, root } = found;
  const faces = [...root.querySelectorAll('[data-ceremony-face-role]')].flatMap(el => {
    const tier = el.getAttribute('data-ceremony-face');
    if (tier !== 'art' && tier !== 'fallback') return [];
    const role = el.getAttribute('data-ceremony-face-role') as DebugCeremonyDressing['faces'][number]['role'];
    return [{ role, tier, widthPx: Math.round(el.getBoundingClientRect().width) } as const];
  });
  const cards = [...root.querySelectorAll('[data-echo-art]')];
  const leaves = root.querySelector('[data-leave-count]');
  return {
    kind,
    faces,
    headingIcons: [...root.querySelectorAll('[data-ceremony-heading-icon]')]
      .map(el => el.getAttribute('data-ceremony-heading-icon') ?? '')
      .filter(Boolean),
    echoCards: cards.length,
    echoCardsWithArt: cards.filter(el => el.getAttribute('data-echo-art') !== 'none').length,
    leaveEchoes: Number(leaves?.getAttribute('data-leave-count') ?? 0) || 0,
    leaveChips: root.querySelectorAll('[data-testid="harvest-leave-chip"]').length,
  };
}
