import { useEffect, useCallback, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from './IconButton';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  maxWidth?: number;
  animation?: 'anim-fade' | 'anim-fade-up';
  children: React.ReactNode;
}

/**
 * Modal — portal-based dialog.
 *
 * Does NOT use AnimateMount because the wrapper div it creates breaks
 * `position: fixed` when animation keyframes use `transform` (creates
 * a new containing block). Instead, the backdrop div handles its own
 * mount/unmount lifecycle and applies animation classes directly.
 */
function ModalRoot({ open, onClose, maxWidth = 600, animation = 'anim-fade-up', children }: ModalProps) {
  const [shouldRender, setShouldRender] = useState(open);
  const [animClass, setAnimClass] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, handleEscape]);

  // Mount/unmount with animation — inline to avoid AnimateMount wrapper div
  useEffect(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (open) {
      setShouldRender(true);
      requestAnimationFrame(() => setAnimClass(`${animation}-enter`));
    } else if (shouldRender) {
      setAnimClass(`${animation}-exit`);
      timeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        setAnimClass('');
      }, 200);
    }
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    };
  }, [open, animation, shouldRender]);

  if (!shouldRender) return null;

  const backdrop: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 60,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '5vh',
  };

  const panel: React.CSSProperties = {
    background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
    border: '1px solid var(--border-gold)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 1px var(--border-gold-strong)',
    maxWidth: `${maxWidth}px`,
    width: '90%',
    maxHeight: '75vh',
    display: 'flex',
    flexDirection: 'column',
  };

  return createPortal(
    <div
      className={animClass}
      style={backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  );
}

function Header({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: 'var(--panel-padding)',
        borderBottom: '1px solid var(--border-gold)',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-lg)',
        color: 'var(--text-primary)',
      }}
    >
      <span style={{ flex: 1 }}>{children}</span>
      {onClose && (
        <IconButton icon={<span>×</span>} variant="close" size="sm" aria-label="Close" onClick={onClose} />
      )}
    </div>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 'var(--panel-padding)', overflowY: 'auto', flex: 1 }}>
      {children}
    </div>
  );
}

function Footer({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 'var(--space-2)',
        padding: 'var(--panel-padding)',
      }}
    >
      {children}
    </div>
  );
}

export const Modal = Object.assign(ModalRoot, { Header, Body, Footer });
