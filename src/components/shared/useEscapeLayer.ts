import { useEffect, useRef } from 'react';

/**
 * Law 23 / Law 50 — Escape closes the topmost surface only (THR-1816).
 *
 * Before this, every overlay hung its own `keydown` listener on `document`, so one
 * Escape reached all of them at once: with a character sheet open over the
 * EncounterVeil, the veil underneath closed too, and the player lost the encounter
 * they were reading. This is the one escape registry: each open surface registers
 * a layer, one shared listener runs only the topmost layer's handler, and the next
 * Escape reaches the surface below.
 *
 * "Topmost" is the stacking band first (Law 35 — the z-index each surface already
 * declares), and registration order within a band, so a sheet opened from an
 * interrupt at the same band still wins because it opened later.
 *
 * Module scope is deliberate here: this is UI input routing (one `document`), not an
 * engine cache, so it is not owned per session.
 */

/** Stacking band for a surface with no z of its own (in-map detail panels). */
export const ESCAPE_LAYER_Z_PANEL = 10;

interface EscapeLayer {
  id: number;
  zIndex: number;
  handler: () => void;
}

const layers: EscapeLayer[] = [];
let nextId = 1;
let listening = false;

function topLayer(): EscapeLayer | undefined {
  let top: EscapeLayer | undefined;
  for (const layer of layers) {
    // `>=` — later registration wins a tie, since `layers` is in registration order.
    if (!top || layer.zIndex >= top.zIndex) top = layer;
  }
  return top;
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.key !== 'Escape' || e.defaultPrevented) return;
  const top = topLayer();
  if (!top) return;
  try {
    top.handler();
  } catch (err) {
    // Fail-soft: a throwing close handler must not leave Escape dead for every
    // surface after it.
    console.error('[escape-layer] handler threw', err);
  }
}

function syncListener(): void {
  if (typeof document === 'undefined') return;
  if (layers.length > 0 && !listening) {
    document.addEventListener('keydown', onKeyDown);
    listening = true;
  } else if (layers.length === 0 && listening) {
    document.removeEventListener('keydown', onKeyDown);
    listening = false;
  }
}

/** Register a layer; returns its unregister function. Exported for tests. */
export function pushEscapeLayer(zIndex: number, handler: () => void): () => void {
  const layer: EscapeLayer = { id: nextId++, zIndex, handler };
  layers.push(layer);
  syncListener();
  return () => {
    const i = layers.findIndex((l) => l.id === layer.id);
    if (i >= 0) layers.splice(i, 1);
    syncListener();
  };
}

/** How many layers are open — the debug/test read of the registry. */
export function getEscapeLayerCount(): number {
  return layers.length;
}

/**
 * Register `onEscape` as an escape layer while `active`. The handler may change
 * identity between renders without re-registering (which would wrongly move the
 * layer to the top of its band).
 */
export function useEscapeLayer(active: boolean, onEscape: () => void, zIndex: number): void {
  const handlerRef = useRef(onEscape);
  useEffect(() => {
    handlerRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!active) return;
    return pushEscapeLayer(zIndex, () => handlerRef.current());
  }, [active, zIndex]);
}
