import React from 'react';
import { Modal } from '../shared/Modal';

interface LocationProfileModalProps {
  name: string;
  onClose: () => void;
}

export const LocationProfileModal = React.memo(function LocationProfileModal({ name, onClose }: LocationProfileModalProps) {
  return (
    <Modal open={true} onClose={onClose} aria-label={`${name} profile`}>
      <Modal.Header onClose={onClose}>{name}</Modal.Header>
      <Modal.Body>
        <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', color: 'var(--text-tertiary)' }}>
            Full location profile coming in a future update.
          </p>
        </div>
      </Modal.Body>
    </Modal>
  );
});

LocationProfileModal.displayName = 'LocationProfileModal';
