/**
 * HomedSurfaceFallback — what a host shows for a homed surface it has no case for
 * (THR-1877 § D1, Law 58: "a kind without an entry shows a plain fallback").
 *
 * Never expected in play: the hosts' switches are exhaustive over their home's kinds,
 * so only data drift reaches here. The dialog names the moment by its clock-holder
 * words, says it has no screen yet, and offers Continue. Continue sets the kind down
 * until its own flag next turns false (`skippedKinds` in the interrupt snapshot), so a
 * surface with no screen can never hold the clock paused forever.
 */
import { useEffect } from 'react';
import { Modal } from '../../shared/Modal';
import { Button } from '../../shared/Button';
import {
  HOMED_SURFACE_FALLBACK_BODY,
  HOMED_SURFACE_FALLBACK_CONTINUE,
  homedSurfaceFallbackTitle,
  type HomedSurfaceKind,
} from '../../../data/homed-surfaces';

/** The S dialog width the fallback takes (THR-1820's S tier, until its tokens land). */
const HOMED_SURFACE_FALLBACK_MAX_WIDTH_PX = 440;

/** Kinds already reported, so a render loop warns once per kind per session. */
const warnedFallbackKinds = new Set<string>();

export interface HomedSurfaceFallbackProps {
  kind: HomedSurfaceKind;
  /** Sets the kind down so the clock can resume. */
  onContinue: (kind: HomedSurfaceKind) => void;
  /** Called once per kind, when it first falls back (the host traces it). */
  onFallback?: (kind: HomedSurfaceKind) => void;
}

export function HomedSurfaceFallback({ kind, onContinue, onFallback }: HomedSurfaceFallbackProps) {
  useEffect(() => {
    if (warnedFallbackKinds.has(kind)) return;
    warnedFallbackKinds.add(kind);
    console.warn(`[homedSurfaces] no host case renders "${kind}" — showing HomedSurfaceFallback. Add its case to its home's host (HOMED_SURFACES, src/data/homed-surfaces.ts).`);
    onFallback?.(kind);
  }, [kind, onFallback]);

  const title = homedSurfaceFallbackTitle(kind);
  return (
    <Modal
      open={true}
      onClose={() => onContinue(kind)}
      maxWidth={HOMED_SURFACE_FALLBACK_MAX_WIDTH_PX}
      aria-label={title}
    >
      <Modal.Header>{title}</Modal.Header>
      <Modal.Body>
        <p data-testid="homed-surface-fallback" data-kind={kind} style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
          {HOMED_SURFACE_FALLBACK_BODY}
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" size="sm" onClick={() => onContinue(kind)} data-testid="homed-surface-fallback-continue">
          {HOMED_SURFACE_FALLBACK_CONTINUE}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

/** Test seam: forget which kinds have warned. */
export function resetHomedSurfaceFallbackWarnings(): void {
  warnedFallbackKinds.clear();
}
