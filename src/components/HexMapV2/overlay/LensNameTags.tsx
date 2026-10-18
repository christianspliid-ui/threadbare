/**
 * LensNameTags — the Threads lens's name tags under each threaded medallion
 * (THR-1878 plan § D4, Player-facing text "Threads name tags").
 *
 * One tag per `agentStep` mark that carries a `tag`: the mortal's name, or the court
 * phrase when it has none ("Your First") — never an id, never an empty tag. Alegreya
 * Sans 700 at THREADS_NAME_TAG_PX with the map labels' dark halo; shown at continental
 * zoom and closer. Positions follow the agent sprites every frame by writing the DOM
 * directly (no React re-render per camera move), as AgentPulseOverlay does.
 *
 * pointer-events: none — a tag is not a click target; the medallion under it is.
 */
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import type { LensMark } from '../../../engine/views/lenses/lensTypes';
import type { AgentSpriteGroup } from '../scene/AgentSpriteMesh';
import type { ZoomTier } from '../scene/ZoomVisibilityMatrix';
import { MAP_OVERLAY_Z } from './mapOverlayZ';

/** Name-tag size under a threaded medallion. NFP #1. */
export const THREADS_NAME_TAG_PX = 14;
/** Gap between the medallion's lower edge and the tag. */
export const THREADS_NAME_TAG_GAP_PX = 4;
/** Tiers that show tags (THR-1878 § D4: continental and closer). */
const TAG_TIERS: ReadonlySet<ZoomTier> = new Set<ZoomTier>(['continental', 'regional', 'hero-local']);

export interface LensNameTagsProps {
  marks: readonly LensMark[];
  agentSpriteGroupRef: RefObject<AgentSpriteGroup | null>;
  cameraRef: RefObject<THREE.OrthographicCamera | null>;
  canvasWidth: number;
  canvasHeight: number;
  zoomTier: ZoomTier;
  zoomK: number;
}

export function LensNameTags({ marks, agentSpriteGroupRef, cameraRef, canvasWidth, canvasHeight, zoomTier, zoomK }: LensNameTagsProps) {
  const tagged = useMemo(() => marks.filter(m => m.kind === 'medallion' && m.agentId && m.tag), [marks]);
  const refs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (tagged.length === 0 || !TAG_TIERS.has(zoomTier)) return;
    let running = true;
    let raf = 0;
    const vec = new THREE.Vector3();
    const update = () => {
      if (!running) return;
      const camera = cameraRef.current;
      const sprites = agentSpriteGroupRef.current?.spriteMap;
      for (const m of tagged) {
        const el = refs.current.get(m.agentId!);
        if (!el) continue;
        const entry = sprites?.get(m.agentId!);
        if (!camera || !entry || !entry.sprite.visible) {
          el.style.display = 'none';
          continue;
        }
        vec.copy(entry.sprite.position);
        vec.project(camera);
        const sx = (vec.x + 1) / 2 * canvasWidth;
        const sy = (1 - vec.y) / 2 * canvasHeight;
        const halfPx = (entry.sprite.scale.y * zoomK) / 2;
        el.style.display = '';
        el.style.transform = `translate(${sx}px, ${sy + halfPx + THREADS_NAME_TAG_GAP_PX}px) translateX(-50%)`;
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, [tagged, agentSpriteGroupRef, cameraRef, canvasWidth, canvasHeight, zoomTier, zoomK]);

  if (tagged.length === 0 || !TAG_TIERS.has(zoomTier)) return null;

  return (
    <div
      data-testid="lens-name-tags"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: MAP_OVERLAY_Z.LENS_NAME_TAGS }}
    >
      {tagged.map(m => (
        <div
          key={m.agentId}
          data-testid="lens-name-tag"
          ref={el => {
            if (el) refs.current.set(m.agentId!, el);
            else refs.current.delete(m.agentId!);
          }}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            display: 'none',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: THREADS_NAME_TAG_PX,
            color: 'var(--text-primary)',
            // The map labels' dark halo (THR-1833 § 5).
            textShadow: '0 0 3px var(--bg-abyss), 0 0 3px var(--bg-abyss), 0 1px 2px var(--bg-abyss)',
          }}
        >
          {m.tag}
        </div>
      ))}
    </div>
  );
}
