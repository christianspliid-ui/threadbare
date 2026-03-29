import React, { useRef, useState, useId, useEffect, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { TooltipContent } from '../../types/tooltip';
import {
  TOOLTIP_SHOW_DELAY,
  TOOLTIP_FADE_OUT,
  TOOLTIP_SIDE_THRESHOLD,
  TOOLTIP_MAX_WIDTH,
  TOOLTIP_OFFSET,
  TOOLTIP_MAX_CHAIN_DEPTH,
  TOOLTIP_LINK_PATTERN,
} from '../../types/tooltip';
import { resolveTooltip } from '../../engine/tooltipResolver';

interface TooltipProps {
  id?: string;
  label?: string;
  desc?: string;
  children: React.ReactNode;
  depth?: number;
  as?: 'span' | 'g';
}

// ────────────────────────────────────────────────────────────────────────────
// Tooltip Style Constants (Dark Tapestry)
// ────────────────────────────────────────────────────────────────────────────

const TOOLTIP_BG = 'var(--bg-surface)';
const TOOLTIP_BORDER = 'var(--border-medium)';
const TOOLTIP_LABEL_COLOR = 'var(--accent-gold)';
const TOOLTIP_DESC_COLOR = 'var(--text-secondary)';
const TOOLTIP_LINK_COLOR = 'var(--accent-gold)';
const TOOLTIP_ARROW_SIZE = 6;

/** Minimum distance (px) between any tooltip edge and the viewport edge. */
const VIEWPORT_MARGIN = 8;

// Gap bridge: invisible padding zone that keeps the tooltip alive while the
// mouse travels across the gap between trigger and popup.
const GAP_BRIDGE_SIZE = TOOLTIP_OFFSET + TOOLTIP_ARROW_SIZE + 4;

type Placement = 'above' | 'below' | 'right' | 'left';

interface TooltipPosition {
  /** CSS top (used for 'below', 'right', 'left' placements). */
  top?: number;
  /** CSS bottom (used for 'above' placement — tooltip grows upward). */
  bottom?: number;
  /** CSS left. */
  left: number;
  /** Where the tooltip sits relative to its trigger. */
  placement: Placement;
  /** Set after useLayoutEffect corrects overflow — prevents infinite loop. */
  corrected?: boolean;
}

/**
 * Parse description text and render {{concept.id}} links as nested Tooltips.
 * RC-015: Uses matchAll() to avoid mutable lastIndex on a shared regex instance.
 */
function parseDescription(
  description: string | undefined,
  depth: number
): React.ReactNode[] {
  if (!description) return [];

  const result: React.ReactNode[] = [];
  let lastIndex = 0;

  // matchAll() creates a fresh iterator — safe under concurrent rendering.
  for (const match of description.matchAll(TOOLTIP_LINK_PATTERN)) {
    if (match.index! > lastIndex) {
      result.push(description.substring(lastIndex, match.index!));
    }

    const conceptId = match[1];
    const resolved = resolveTooltip(conceptId);

    if (resolved && depth < TOOLTIP_MAX_CHAIN_DEPTH) {
      result.push(
        <Tooltip
          key={`link-${match.index}-${conceptId}`}
          id={conceptId}
          depth={depth + 1}
        >
          <span
            data-tooltip-link={conceptId}
            style={{
              color: TOOLTIP_LINK_COLOR,
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            {resolved.label}
          </span>
        </Tooltip>
      );
    } else {
      result.push(match[0]);
    }

    lastIndex = match.index! + match[0].length;
  }

  if (lastIndex < description.length) {
    result.push(description.substring(lastIndex));
  }

  return result;
}

/**
 * Tooltip component with hover delay, keyboard escape, and smart positioning.
 *
 * Positioning strategy:
 * - Depth 0: above or below the trigger (default above, flip if near edge).
 * - Depth 1+: right or left of the parent tooltip (flip if near edge).
 *
 * After the initial render, a useLayoutEffect measures the tooltip's actual
 * bounding rect and flips/clamps placement if any edge overflows the viewport.
 * This runs before paint so the user never sees the wrong position.
 */
export const Tooltip = React.memo(function Tooltip({
  id,
  label: explicitLabel,
  desc: explicitDesc,
  children,
  depth = 0,
  as = 'span',
}: TooltipProps) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLElement | SVGGElement>(null);
  const tooltipOuterRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  const showTimerRef = useRef<NodeJS.Timeout>();
  const hideTimerRef = useRef<NodeJS.Timeout>();

  const resolvedContent: TooltipContent | null = id
    ? resolveTooltip(id)
    : null;

  const finalLabel = explicitLabel || resolvedContent?.label;
  const finalDesc = explicitDesc || resolvedContent?.desc;
  const hasContent = !!finalLabel;

  // ──────────────────────────────────────────────────────────────────────────
  // Position Calculation (Phase 1 — best guess before measuring)
  // ──────────────────────────────────────────────────────────────────────────

  const calculatePosition = () => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    if (depth > 0) {
      // ── Chained tooltip: position to the side of the parent tooltip ──
      const parentTooltip = triggerRef.current.closest('[role="tooltip"]');
      const parentRect = parentTooltip
        ? parentTooltip.getBoundingClientRect()
        : triggerRect;

      const spaceRight = viewportWidth - parentRect.right - TOOLTIP_OFFSET;
      const spaceLeft = parentRect.left - TOOLTIP_OFFSET;

      if (spaceRight >= TOOLTIP_MAX_WIDTH + VIEWPORT_MARGIN) {
        setPosition({
          top: Math.max(VIEWPORT_MARGIN, triggerRect.top - 8),
          left: parentRect.right + TOOLTIP_OFFSET,
          placement: 'right',
        });
      } else if (spaceLeft >= TOOLTIP_MAX_WIDTH + VIEWPORT_MARGIN) {
        setPosition({
          top: Math.max(VIEWPORT_MARGIN, triggerRect.top - 8),
          left: parentRect.left - TOOLTIP_MAX_WIDTH - TOOLTIP_OFFSET,
          placement: 'left',
        });
      } else {
        // Fallback: below the parent tooltip
        setPosition({
          top: parentRect.bottom + TOOLTIP_OFFSET,
          left: Math.max(
            VIEWPORT_MARGIN,
            Math.min(
              triggerRect.left,
              viewportWidth - TOOLTIP_MAX_WIDTH - VIEWPORT_MARGIN
            )
          ),
          placement: 'below',
        });
      }
    } else {
      // ── Root tooltip: position above or below the trigger ──

      // Horizontal: center on trigger, clamped to viewport
      let left = triggerRect.left + triggerRect.width / 2 - TOOLTIP_MAX_WIDTH / 2;
      if (left + TOOLTIP_MAX_WIDTH > viewportWidth - VIEWPORT_MARGIN) {
        left = viewportWidth - TOOLTIP_MAX_WIDTH - VIEWPORT_MARGIN;
      }
      if (left < VIEWPORT_MARGIN) {
        left = VIEWPORT_MARGIN;
      }

      // Default: above. Use CSS `bottom` so tooltip grows upward naturally.
      const bottomValue = viewportHeight - triggerRect.top + TOOLTIP_OFFSET + TOOLTIP_ARROW_SIZE;
      setPosition({
        bottom: bottomValue,
        left,
        placement: 'above',
      });
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 2 — Measure and correct overflow before paint
  // ──────────────────────────────────────────────────────────────────────────

  useLayoutEffect(() => {
    const el = tooltipOuterRef.current;
    if (!isVisible || !el || !position || position.corrected || !triggerRef.current) return;

    const rect = el.getBoundingClientRect();
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    let corrected: TooltipPosition | null = null;

    // ── Vertical overflow ──
    if (position.placement === 'above' && rect.top < VIEWPORT_MARGIN) {
      // Tooltip overflows top of viewport — flip to below
      corrected = {
        top: triggerRect.bottom + TOOLTIP_OFFSET + TOOLTIP_ARROW_SIZE,
        left: position.left,
        placement: 'below',
        corrected: true,
      };
    } else if (position.placement === 'below' && rect.bottom > vh - VIEWPORT_MARGIN) {
      // Tooltip overflows bottom — try flipping to above
      const aboveBottom = vh - triggerRect.top + TOOLTIP_OFFSET + TOOLTIP_ARROW_SIZE;
      corrected = {
        bottom: aboveBottom,
        left: position.left,
        placement: 'above',
        corrected: true,
      };
    } else if ((position.placement === 'right' || position.placement === 'left') && rect.bottom > vh - VIEWPORT_MARGIN) {
      // Side-placed tooltip overflows bottom — clamp top upward
      corrected = {
        ...position,
        top: (position.top ?? 0) - (rect.bottom - vh + VIEWPORT_MARGIN),
        corrected: true,
      };
    } else if ((position.placement === 'right' || position.placement === 'left') && rect.top < VIEWPORT_MARGIN) {
      // Side-placed tooltip overflows top — clamp top downward
      corrected = {
        ...position,
        top: VIEWPORT_MARGIN,
        corrected: true,
      };
    }

    // ── Horizontal overflow ──
    if (rect.right > vw - VIEWPORT_MARGIN) {
      corrected = corrected || { ...position, corrected: true };
      corrected.left = vw - VIEWPORT_MARGIN - rect.width;
      if (corrected.left < VIEWPORT_MARGIN) corrected.left = VIEWPORT_MARGIN;
    } else if (rect.left < VIEWPORT_MARGIN) {
      corrected = corrected || { ...position, corrected: true };
      corrected.left = VIEWPORT_MARGIN;
    }

    if (corrected) {
      setPosition(corrected);
    }
  }, [isVisible, position]);

  // ──────────────────────────────────────────────────────────────────────────
  // Show/Hide Handlers
  // ──────────────────────────────────────────────────────────────────────────

  const showTooltip = () => {
    if (!hasContent) return;

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = undefined;
    }

    if (isVisible) return;

    showTimerRef.current = setTimeout(() => {
      calculatePosition();
      setIsVisible(true);
    }, TOOLTIP_SHOW_DELAY);
  };

  const hideTooltip = () => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = undefined;
    }

    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, TOOLTIP_FADE_OUT);
  };

  const handlePointerEnter = () => showTooltip();
  const handlePointerLeave = () => hideTooltip();
  const handleFocus = () => showTooltip();
  const handleBlur = () => hideTooltip();

  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsVisible(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  useEffect(() => {
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────

  const parsedDesc = useMemo(
    () => parseDescription(finalDesc, depth),
    [finalDesc, depth]
  );

  // Outer wrapper style — includes gap-bridge padding for hover continuity.
  const outerStyle: React.CSSProperties = (() => {
    if (!position) return { position: 'fixed', zIndex: 70 + depth };
    const base: React.CSSProperties = {
      position: 'fixed',
      left: position.left,
      maxWidth: TOOLTIP_MAX_WIDTH,
      zIndex: 70 + depth,
      pointerEvents: isVisible ? 'auto' : 'none',
    };

    switch (position.placement) {
      case 'above':
        return {
          ...base,
          bottom: position.bottom,
          paddingBottom: GAP_BRIDGE_SIZE,
        };
      case 'below':
        return {
          ...base,
          top: (position.top ?? 0) - GAP_BRIDGE_SIZE,
          paddingTop: GAP_BRIDGE_SIZE,
        };
      case 'right':
        return {
          ...base,
          top: position.top,
          left: (position.left ?? 0) - GAP_BRIDGE_SIZE,
          paddingLeft: GAP_BRIDGE_SIZE,
        };
      case 'left':
        return {
          ...base,
          top: position.top,
          paddingRight: GAP_BRIDGE_SIZE,
        };
    }
  })();

  // Arrow — only for above/below root tooltips.
  const arrowElement = position && (position.placement === 'above' || position.placement === 'below') ? (
    <div
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        borderLeft: `${TOOLTIP_ARROW_SIZE}px solid transparent`,
        borderRight: `${TOOLTIP_ARROW_SIZE}px solid transparent`,
        ...(position.placement === 'above'
          ? {
              bottom: -TOOLTIP_ARROW_SIZE,
              borderTop: `${TOOLTIP_ARROW_SIZE}px solid ${TOOLTIP_BG}`,
            }
          : {
              top: -TOOLTIP_ARROW_SIZE,
              borderBottom: `${TOOLTIP_ARROW_SIZE}px solid ${TOOLTIP_BG}`,
            }),
        left: '50%',
        transform: 'translateX(-50%)',
      }}
    />
  ) : null;

  // RC-014: aria-live="polite" announces tooltip content to screen readers
  const tooltipContent = (
    <div
      ref={tooltipOuterRef}
      id={tooltipId}
      role="tooltip"
      aria-live="polite"
      onPointerEnter={showTooltip}
      onPointerLeave={hideTooltip}
      style={outerStyle}
    >
      <div
        style={{
          backgroundColor: TOOLTIP_BG,
          border: `1px solid ${TOOLTIP_BORDER}`,
          borderRadius: '0.25rem',
          padding: '0.625rem 0.625rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          opacity: isVisible ? 1 : 0,
          transition: `opacity ${TOOLTIP_FADE_OUT}ms ease-out`,
          position: 'relative',
        }}
      >
        <div
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: '600',
            color: TOOLTIP_LABEL_COLOR,
            fontFamily: 'var(--font-display)',
            marginBottom: finalDesc ? '0.25rem' : 0,
          }}
        >
          {finalLabel}
        </div>

        {finalDesc && (
          <div
            style={{
              fontSize: 'var(--text-xs)',
              color: TOOLTIP_DESC_COLOR,
              fontFamily: 'var(--font-body)',
              lineHeight: '1.4',
              pointerEvents: 'auto',
            }}
          >
            {parsedDesc}
          </div>
        )}

        {arrowElement}
      </div>
    </div>
  );

  const WrapperTag = as;
  const wrapperStyle = as === 'g' ? undefined : { display: 'inline-block' as const, cursor: 'inherit' as const };

  return (
    <>
      <WrapperTag
        ref={triggerRef as any}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-describedby={isVisible ? tooltipId : undefined}
        style={wrapperStyle}
      >
        {children}
      </WrapperTag>

      {isVisible && position && createPortal(tooltipContent, document.body)}
    </>
  );
});

Tooltip.displayName = 'Tooltip';
