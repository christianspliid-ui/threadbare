import React, { useRef, useState, useId, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { TooltipContent } from '../../types/tooltip';
import {
  TOOLTIP_SHOW_DELAY,
  TOOLTIP_FADE_OUT,
  TOOLTIP_TOP_THRESHOLD,
  TOOLTIP_SIDE_THRESHOLD,
  TOOLTIP_MAX_WIDTH,
  TOOLTIP_OFFSET,
  TOOLTIP_MAX_CHAIN_DEPTH,
  TOOLTIP_LINK_PATTERN,
} from '../../types/tooltip';
import { resolveTooltip } from '../../engine/tooltipResolver';

interface TooltipProps {
  /**
   * Tooltip ID to resolve content from (e.g., "ui.doom_bar", "sphere.force").
   * Will be overridden by explicit label/desc if provided.
   */
  id?: string;

  /**
   * Explicit label (overrides resolved content).
   */
  label?: string;

  /**
   * Explicit description (overrides resolved content).
   * May contain {{concept.id}} links (Task 5).
   */
  desc?: string;

  /**
   * The element that triggers the tooltip on hover/focus.
   */
  children: React.ReactNode;

  /**
   * Internal depth counter for tooltip chain tracking (Task 5).
   * @internal
   */
  depth?: number;
}

// ────────────────────────────────────────────────────────────────────────────
// Tooltip Style Constants (Threadbare)
// ────────────────────────────────────────────────────────────────────────────

const TOOLTIP_BG = '#1a1a1e';
const TOOLTIP_BORDER = '#57534e';
const TOOLTIP_LABEL_COLOR = '#fcd34d';     // amber-200 (Cinzel)
const TOOLTIP_DESC_COLOR = '#a8a29e';      // stone-400 (Inter)
const TOOLTIP_LINK_COLOR = '#fbbf24';      // amber-400 for linked concepts
const TOOLTIP_ARROW_SIZE = 6;              // px for arrow triangle

/**
 * Parse description text and render {{concept.id}} links as nested Tooltips.
 *
 * Splits on TOOLTIP_LINK_PATTERN regex and:
 * - For resolved concepts at depth < TOOLTIP_MAX_CHAIN_DEPTH:
 *   renders as underlined amber-400 span wrapped in nested Tooltip
 * - For unresolved or at max depth:
 *   renders as plain text (raw marker without {{ }})
 *
 * Returns array of text strings and tooltip-wrapped span elements.
 */
function parseDescription(
  description: string | undefined,
  depth: number
): React.ReactNode[] {
  if (!description) return [];

  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex state
  const regex = new RegExp(TOOLTIP_LINK_PATTERN);

  while ((match = regex.exec(description)) !== null) {
    // Push text before the match
    if (match.index > lastIndex) {
      result.push(description.substring(lastIndex, match.index));
    }

    const conceptId = match[1];
    const resolved = resolveTooltip(conceptId);

    if (resolved && depth < TOOLTIP_MAX_CHAIN_DEPTH) {
      // Render as nested Tooltip with underlined link
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
      // Unresolved or at max depth: render raw marker text (without {{ }})
      result.push(match[0]);
    }

    lastIndex = regex.lastIndex;
  }

  // Push remaining text after last match
  if (lastIndex < description.length) {
    result.push(description.substring(lastIndex));
  }

  return result;
}

/**
 * Tooltip component with hover delay, keyboard escape, and smart positioning.
 *
 * Renders a trigger element (children) that shows/hides a tooltip on hover, focus,
 * or Escape key. Content is resolved from an ID, or explicitly provided.
 *
 * Portal-renders the tooltip to document.body with absolute positioning.
 * Flips placement and shifts horizontally to stay within viewport.
 */
export const Tooltip = React.memo(function Tooltip({
  id,
  label: explicitLabel,
  desc: explicitDesc,
  children,
  depth = 0,
}: TooltipProps) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    placement: 'above' | 'below';
  } | null>(null);

  const showTimerRef = useRef<NodeJS.Timeout>();
  const hideTimerRef = useRef<NodeJS.Timeout>();
  const escapeListenerRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  // Resolve content from id or use explicit values
  const resolvedContent: TooltipContent | null = id
    ? resolveTooltip(id)
    : null;

  const finalLabel = explicitLabel || resolvedContent?.label;
  const finalDesc = explicitDesc || resolvedContent?.desc;

  // Don't show tooltip if no content
  const hasContent = !!finalLabel;

  // ──────────────────────────────────────────────────────────────────────────
  // Position Calculation
  // ──────────────────────────────────────────────────────────────────────────

  const calculatePosition = () => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Start with positioning above the trigger
    let placement: 'above' | 'below' = 'above';
    let top = triggerRect.top - TOOLTIP_OFFSET - TOOLTIP_ARROW_SIZE;

    // Flip to below if trigger is too close to top edge
    if (triggerRect.top < TOOLTIP_TOP_THRESHOLD) {
      placement = 'below';
      top = triggerRect.bottom + TOOLTIP_OFFSET + TOOLTIP_ARROW_SIZE;
    }

    // Horizontal positioning: center on trigger
    let left = triggerRect.left + triggerRect.width / 2 - TOOLTIP_MAX_WIDTH / 2;

    // Shift left if too close to right edge
    if (left + TOOLTIP_MAX_WIDTH > viewportWidth - TOOLTIP_SIDE_THRESHOLD) {
      left = viewportWidth - TOOLTIP_MAX_WIDTH - TOOLTIP_SIDE_THRESHOLD;
    }

    // Shift right if too close to left edge
    if (left < TOOLTIP_SIDE_THRESHOLD) {
      left = TOOLTIP_SIDE_THRESHOLD;
    }

    setPosition({ top, left, placement });
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Show/Hide Handlers
  // ──────────────────────────────────────────────────────────────────────────

  const showTooltip = () => {
    if (!hasContent) return;

    // Cancel any pending hide
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = undefined;
    }

    // Set up show delay
    showTimerRef.current = setTimeout(() => {
      calculatePosition();
      setIsVisible(true);

      // Add escape listener when visible
      if (!escapeListenerRef.current) {
        escapeListenerRef.current = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            hideTooltip();
          }
        };
        document.addEventListener('keydown', escapeListenerRef.current);
      }
    }, TOOLTIP_SHOW_DELAY);
  };

  const hideTooltip = () => {
    // Cancel show timer if still pending
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = undefined;
    }

    // Start fade-out
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);

      // Remove escape listener
      if (escapeListenerRef.current) {
        document.removeEventListener('keydown', escapeListenerRef.current);
        escapeListenerRef.current = null;
      }
    }, TOOLTIP_FADE_OUT);
  };

  const handlePointerEnter = () => showTooltip();
  const handlePointerLeave = () => hideTooltip();
  const handleFocus = () => showTooltip();
  const handleBlur = () => hideTooltip();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (escapeListenerRef.current) {
        document.removeEventListener('keydown', escapeListenerRef.current);
      }
    };
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────

  const tooltipContent = (
    <div
      id={tooltipId}
      role="tooltip"
      style={{
        position: 'fixed',
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        maxWidth: TOOLTIP_MAX_WIDTH,
        backgroundColor: TOOLTIP_BG,
        border: `1px solid ${TOOLTIP_BORDER}`,
        borderRadius: '0.25rem',
        padding: '0.625rem 0.625rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        zIndex: 50,
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
        transition: `opacity ${TOOLTIP_FADE_OUT}ms ease-out`,
      }}
    >
      {/* Label */}
      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: '600',
          color: TOOLTIP_LABEL_COLOR,
          fontFamily: 'Cinzel, serif',
          marginBottom: finalDesc ? '0.25rem' : 0,
        }}
      >
        {finalLabel}
      </div>

      {/* Description */}
      {finalDesc && (
        <div
          style={{
            fontSize: '0.75rem',
            color: TOOLTIP_DESC_COLOR,
            fontFamily: 'Inter, system-ui, sans-serif',
            lineHeight: '1.4',
            pointerEvents: 'auto',
          }}
        >
          {parseDescription(finalDesc, depth)}
        </div>
      )}

      {/* Arrow */}
      <div
        style={{
          position: 'absolute',
          width: 0,
          height: 0,
          borderLeft: `${TOOLTIP_ARROW_SIZE}px solid transparent`,
          borderRight: `${TOOLTIP_ARROW_SIZE}px solid transparent`,
          ...(position?.placement === 'above'
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
    </div>
  );

  return (
    <>
      {/* Trigger wrapper */}
      <span
        ref={triggerRef}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-describedby={isVisible ? tooltipId : undefined}
        style={{
          display: 'inline-block',
          cursor: 'inherit',
        }}
      >
        {children}
      </span>

      {/* Portal tooltip */}
      {isVisible && position && createPortal(tooltipContent, document.body)}
    </>
  );
});

Tooltip.displayName = 'Tooltip';
