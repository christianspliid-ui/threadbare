import React from 'react';
import { Modal } from '../shared/Modal';

interface FactionSheetProps {
  name: string;
  onClose: () => void;
}

export const FactionSheet = React.memo(function FactionSheet({ name, onClose }: FactionSheetProps) {
  return (
    <Modal open={true} onClose={onClose} aria-label={`${name} profile`}>
      <Modal.Header onClose={onClose}>{name}</Modal.Header>
      <Modal.Body>
        <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', color: 'var(--text-tertiary)' }}>
            Full faction sheet coming in a future update.
          </p>
        </div>
      </Modal.Body>
    </Modal>
  );
});

FactionSheet.displayName = 'FactionSheet';
