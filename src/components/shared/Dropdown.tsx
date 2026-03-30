import { useEffect, useRef, useState, useCallback, cloneElement, isValidElement } from 'react';
import { createPortal } from 'react-dom';
import { AnimateMount } from './AnimateMount';

interface DropdownProps {
  trigger: React.ReactElement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  align?: 'left' | 'right';
  children: React.ReactNode;
}

function DropdownRoot({ trigger, open, onOpenChange, align = 'right', children }: DropdownProps) {
  const triggerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<React.CSSProperties>({});

  // Calculate position from trigger rect
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const pos: React.CSSProperties = {
      position: 'fixed',
      top: rect.bottom + 4,
      zIndex: 9999,
    };
    if (align === 'right') {
      pos.right = window.innerWidth - rect.right;
    } else {
      pos.left = rect.left;
    }
    setPosition(pos);
  }, [open, align]);

  // Outside click
  const handleOutsideClick = useCallback(
    (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        onOpenChange(false);
      }
    },
    [onOpenChange],
  );

  // Escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, handleOutsideClick, handleEscape]);

  // Clone trigger to attach ref
  const triggerElement = isValidElement(trigger)
    ? cloneElement(trigger as React.ReactElement<{ ref?: React.Ref<HTMLElement> }>, { ref: triggerRef })
    : trigger;

  const panelStyle: React.CSSProperties = {
    ...position,
    minWidth: '200px',
    maxWidth: '320px',
    background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--panel-radius)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
    padding: 'var(--panel-padding)',
  };

  return (
    <>
      {triggerElement}
      {createPortal(
        <AnimateMount show={open} animation="anim-fade-down">
          <div ref={panelRef} style={panelStyle} data-testid="dropdown-panel">
            {children}
          </div>
        </AnimateMount>,
        document.body,
      )}
    </>
  );
}

interface ItemProps {
  children: React.ReactNode;
  onClick?: () => void;
}

function Item({ children, onClick }: ItemProps) {
  function handleMouseEnter(e: React.MouseEvent<HTMLDivElement>) {
    e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
  }
  function handleMouseLeave(e: React.MouseEvent<HTMLDivElement>) {
    e.currentTarget.style.backgroundColor = '';
  }

  return (
    <div
      role="menuitem"
      tabIndex={0}
      style={{
        padding: '0.5rem 0.75rem',
        borderRadius: '0.375rem',
        cursor: onClick ? 'pointer' : undefined,
        transition: 'background-color var(--anim-fast) ease',
      }}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {children}
    </div>
  );
}

export const Dropdown = Object.assign(DropdownRoot, { Item });
