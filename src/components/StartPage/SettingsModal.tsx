import { Modal } from '../shared/Modal';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <Modal.Header onClose={onClose}>Settings</Modal.Header>
      <Modal.Body>
        <p style={{ color: 'var(--text-secondary)' }}>Settings coming soon.</p>
      </Modal.Body>
    </Modal>
  );
}
