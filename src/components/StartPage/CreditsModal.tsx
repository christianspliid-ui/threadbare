import { Modal } from '../shared/Modal';

interface CreditsModalProps {
  open: boolean;
  onClose: () => void;
}

const TECH_CREDITS = ['React', 'Three.js', 'TypeScript', 'Vite'];

export function CreditsModal({ open, onClose }: CreditsModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <Modal.Header onClose={onClose}>Credits</Modal.Header>
      <Modal.Body>
        <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>

          {/* Game title */}
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--accent-gold)',
              letterSpacing: '0.15em',
              fontSize: 'var(--text-xl)',
              fontWeight: 400,
              margin: 0,
            }}
          >
            THREADBAERER
          </h2>

          {/* Separator */}
          <div
            style={{
              height: '1px',
              background: 'var(--border-subtle)',
              margin: 'var(--space-4) 0',
            }}
          />

          {/* Author */}
          <p
            style={{
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              margin: '0 0 var(--space-6)',
            }}
          >
            A game by the creator
          </p>

          {/* Technology section */}
          <p
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              fontSize: 'var(--text-sm)',
              letterSpacing: '0.1em',
              margin: '0 0 var(--space-2)',
            }}
          >
            Built With
          </p>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-1)',
            }}
          >
            {TECH_CREDITS.map((tech) => (
              <li
                key={tech}
                style={{
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-base)',
                }}
              >
                {tech}
              </li>
            ))}
          </ul>

          {/* Separator */}
          <div
            style={{
              height: '1px',
              background: 'var(--border-subtle)',
              margin: 'var(--space-4) 0',
            }}
          />

          {/* Closing lore line */}
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-base)',
              margin: 0,
            }}
          >
            The threads continue.
          </p>

        </div>
      </Modal.Body>
    </Modal>
  );
}
