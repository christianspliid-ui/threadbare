import React from 'react';
import { Modal } from '../shared/Modal';

interface ArtifactSheetProps {
  name: string;
  onClose: () => void;
}

export const ArtifactSheet = React.memo(function ArtifactSheet({ name, onClose }: ArtifactSheetProps) {
  return (
    <Modal open={true} onClose={onClose} aria-label={`${name} profile`}>
      <Modal.Header onClose={onClose}>{name}</Modal.Header>
      <Modal.Body>
        <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', color: 'var(--text-tertiary)' }}>
            Full artifact sheet coming in a future update.
          </p>
        </div>
      </Modal.Body>
    </Modal>
  );
});

ArtifactSheet.displayName = 'ArtifactSheet';
