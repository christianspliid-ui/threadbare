import { Modal } from '../shared/Modal';

interface CreditsModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreditsModal({ open, onClose }: CreditsModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <Modal.Header onClose={onClose}>Credits</Modal.Header>
      <Modal.Body>
        <p style={{ color: 'var(--text-secondary)' }}>Credits coming soon.</p>
      </Modal.Body>
    </Modal>
  );
}
