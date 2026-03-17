import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimateMount } from './AnimateMount';
import { IconButton } from './IconButton';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  maxWidth?: number;
  animation?: 'anim-fade' | 'anim-fade-up';
  children: React.ReactNode;
}

function ModalRoot({ open, onClose, maxWidth = 600, animation = 'anim-fade-up', children }: ModalProps) {
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

  const backdrop: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const panel: React.CSSProperties = {
    background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
    maxWidth: `${maxWidth}px`,
    width: '90%',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
  };

  return createPortal(
    <AnimateMount show={open} animation={animation}>
      <div
        style={backdrop}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <div style={panel} onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </AnimateMount>,
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
        borderBottom: '1px solid var(--border-subtle)',
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
