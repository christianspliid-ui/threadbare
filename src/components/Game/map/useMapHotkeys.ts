/**
 * useMapHotkeys — binds every `MAP_COMMANDS` row's keys (THR-1900, plan THR-1878 D9).
 *
 * PageUp / PageDown zoom, arrows pan, Home centres on the First, F shows known land. The
 * button and the key run the same command through `onCommand`, so they cannot disagree.
 *
 * **Inert** (Law 23) while focus is in a text field, or in a composite widget that uses the
 * arrows or Home itself (tablist, toolbar, listbox, menu, grid, radiogroup, slider…), and
 * while any escape layer above the map's own chrome is open (a drawer, the Stage, a ceremony,
 * a dialog, a menu). A tooltip or an in-map panel (the `mapOverlay` band) does not mute them:
 * both open over the map constantly, and the keys still act on the map. Escape is never
 * bound here. Modifier chords (Ctrl/Meta/Alt) pass through to the browser.
 *
 * **Scrollable panels keep their keys** (review gate, THR-1900): after a click inside a
 * scrolling panel (the Ledger rail, the Chronicle) the browser scrolls that panel on
 * PageDown / arrows / Home even though focus stays on `<body>`. So the keys stand down when
 * the last pressed or focused element sits inside a panel that can scroll; a click on the map
 * (or anywhere that cannot scroll) gives them back.
 */
import { useEffect, useRef } from 'react';
import { mapCommandForKey, type MapCommandId } from '../../../data/map-commands';
import { getEscapeLayers } from '../../shared/useEscapeLayer';
import { Z_BAND } from '../../shared/zBands';

/** Roles whose widgets read arrows or Home themselves (WAI-ARIA composite widgets). */
const COMPOSITE_ROLES: ReadonlySet<string> = new Set([
  'tablist', 'tab', 'toolbar', 'listbox', 'option', 'menu', 'menubar', 'menuitem',
  'menuitemcheckbox', 'menuitemradio', 'grid', 'gridcell', 'tree', 'treeitem',
  'treegrid', 'radiogroup', 'radio', 'slider', 'spinbutton', 'combobox',
]);

/** An escape layer in this band covers the map: drawers, the Stage, ceremonies, dialogs, menus. */
export function bandCoversMap(band: number): boolean {
  return (band > Z_BAND.hud && band < Z_BAND.tooltip) || band >= Z_BAND.menu;
}

/** Where the pointer last went down — the element the browser's own key scrolling follows. */
let lastPointerTarget: Element | null = null;

/** Test seam: what the last pointer press landed on. */
export function setLastPointerTarget(el: Element | null): void {
  lastPointerTarget = el;
}

/** True when `el` or an ancestor scrolls (overflow auto/scroll with content past its box). */
export function insideScrollablePanel(el: Element | null, doc: Document = document): boolean {
  for (let node = el; node && node !== doc.body && node !== doc.documentElement; node = node.parentElement) {
    if (!(node instanceof HTMLElement)) continue;
    const style = doc.defaultView?.getComputedStyle(node);
    if (!style) continue;
    const scrollsY = /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight;
    const scrollsX = /(auto|scroll)/.test(style.overflowX) && node.scrollWidth > node.clientWidth;
    if (scrollsY || scrollsX) return true;
  }
  return false;
}

/**
 * True when the map keys must stay quiet: focus is in a text field or a composite widget,
 * an escape layer that covers the map is open, a modal dialog is open or holds focus, or the last pressed / focused element sits in
 * a scrollable panel (which the browser scrolls with these keys).
 */
export function mapKeysInert(doc: Document = document): boolean {
  if (getEscapeLayers().some(layer => bandCoversMap(layer.band))) return true;
  // A modal dialog that registers no escape layer (the DetailModal card stack) still covers the map.
  if (doc.querySelector('[aria-modal="true"]')) return true;
  const el = doc.activeElement as HTMLElement | null;
  if (el?.closest('[role="dialog"], [role="alertdialog"]')) return true;
  if (!el || el === doc.body) return insideScrollablePanel(lastPointerTarget, doc);
  if (insideScrollablePanel(el, doc)) return true;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable || el.hasAttribute('contenteditable')) {
    return true;
  }
  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    const role = node.getAttribute('role');
    if (role && COMPOSITE_ROLES.has(role)) {
      // The map's own control cluster is a toolbar, but its buttons take no arrows: keep the keys live there.
      if (node.dataset.testid === 'map-controls') return false;
      return true;
    }
  }
  return false;
}

export function useMapHotkeys(onCommand: (id: MapCommandId) => void, enabled = true): void {
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  useEffect(() => {
    if (!enabled) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      const cmd = mapCommandForKey(e.key);
      if (!cmd) return;
      if (mapKeysInert()) return;
      e.preventDefault();
      onCommandRef.current(cmd.id);
    }
    function handlePointerDown(e: PointerEvent) {
      lastPointerTarget = e.target instanceof Element ? e.target : null;
    }
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [enabled]);
}
