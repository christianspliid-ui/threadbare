/**
 * HandCardHover — a hand row's full card face, beside the god rail (THR-1975, frame plan § F6).
 *
 * The hand row is one line (name and par price, THR-2177); the card it stands for is the
 * shared `CardFace` (THR-1002). Hovering the row lays that face beside the rail — the
 * picture, the verb chip, the paying sphere's tint, the framed par price, the card's one
 * line — so a player reads the whole card without arming it.
 *
 * It keeps `HoverCard`'s three rules (THR-1490): it never stacks (the row's own tooltip is
 * gone, Law 3), it is not interactive (`pointer-events: none` and `inert`, so the face's
 * button can never take focus or a click), and it stays on screen (clamped to the
 * viewport, Law 33).
 */
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { CardFace, CARD_WIDTH_PX, type CardFaceModel } from '../../shared/CardFace';
import { isNudgeDesignerViewEnabled, subscribeNudgeDesignerView } from '../encounter-stage/designerView';

/** Gap between the rail's edge and the face, px. */
export const HAND_CARD_HOVER_GAP_PX = 8;
/** Viewport margin the face keeps clear on every side, px. */
export const HAND_CARD_HOVER_MARGIN_PX = 12;

type Box = { top: number; bottom: number; left: number; right: number };

/**
 * Place the face beside the rail, level with the row, inside the viewport.
 *
 * Right of the rail where it fits, left of it where it does not (a rail on the right edge);
 * the top follows the row and is pulled up so the face's bottom stays on screen. Exported
 * for the test — the clamp is the part a screenshot at one size cannot show.
 */
export function handCardHoverPosition(
  row: Pick<Box, 'top'>,
  rail: Pick<Box, 'left' | 'right'>,
  viewport: { width: number; height: number },
  faceHeight: number,
  faceWidth: number = CARD_WIDTH_PX,
): { top: number; left: number } {
  const m = HAND_CARD_HOVER_MARGIN_PX;
  const right = rail.right + HAND_CARD_HOVER_GAP_PX;
  const left =
    right + faceWidth + m <= viewport.width
      ? right
      : Math.max(m, rail.left - HAND_CARD_HOVER_GAP_PX - faceWidth);
  const maxTop = viewport.height - m - faceHeight;
  const top = Math.max(m, Math.min(row.top, maxTop));
  return { top, left };
}

const noop = () => undefined;

export function HandCardHover({ model, anchorEl }: { model: CardFaceModel; anchorEl: HTMLElement }) {
  const designerView = useSyncExternalStore(subscribeNudgeDesignerView, isNudgeDesignerViewEnabled, isNudgeDesignerViewEnabled);
  const ref = useRef<HTMLDivElement>(null);
  const [faceHeight, setFaceHeight] = useState(0);

  // The face's real height, once drawn, so the clamp keeps its bottom on screen.
  useLayoutEffect(() => {
    const h = ref.current?.offsetHeight ?? 0;
    if (h > 0 && Math.abs(h - faceHeight) > 1) setFaceHeight(h);
  });

  const railEl = anchorEl.closest<HTMLElement>('[data-testid="god-rail"]') ?? anchorEl;
  const { top, left } = handCardHoverPosition(
    anchorEl.getBoundingClientRect(),
    railEl.getBoundingClientRect(),
    { width: window.innerWidth, height: window.innerHeight },
    faceHeight,
  );

  return createPortal(
    <div
      ref={ref}
      data-testid="hand-card-hover"
      data-card-id={model.id}
      role="tooltip"
      aria-hidden="true"
      inert
      style={{
        position: 'fixed',
        top,
        left,
        width: CARD_WIDTH_PX,
        maxHeight: `calc(100dvh - ${2 * HAND_CARD_HOVER_MARGIN_PX}px)`,
        display: 'flex',
        // Above the drawers and panels, below the modal band — `HoverCard`'s layer.
        zIndex: 60,
        boxShadow: '0 6px 28px rgba(0, 0, 0, 0.6)',
        borderRadius: 'var(--radius-control)',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <CardFace model={model} designerView={designerView} onToggle={noop} />
    </div>,
    document.body,
  );
}
