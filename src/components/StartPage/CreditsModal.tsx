import type { CSSProperties } from 'react';
import { Modal } from '../shared/Modal';
import { ICON_CREDITS } from '../../data/icons/iconRegistry';
import { GAME_ICONS_SOURCE } from '../../data/icons/carvedShapes.generated';

interface CreditsModalProps {
  open: boolean;
  onClose: () => void;
}

const TECH_CREDITS = ['React', 'Three.js', 'TypeScript', 'Vite'];

const SECTION_LABEL: CSSProperties = {
  font: 'var(--type-section-label)',
  color: 'var(--text-tertiary)',
};

const LINK: CSSProperties = {
  color: 'var(--accent-gold)',
  textDecoration: 'underline',
};

/** "A, B and C" — the credited authors as one sentence. */
export function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function CreditsModal({ open, onClose }: CreditsModalProps) {
  return (
    <Modal open={open} onClose={onClose} size="s" aria-label="Credits">
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
            THREADBEARER
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

          {/* Technology section — the label rule (THR-1879 § 2) */}
          <p
            style={{
              ...SECTION_LABEL,
              margin: '0 0 var(--space-2)',
            }}
          >
            Built with
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

          {/* Fonts (THR-1879 § 8; the licence is public/fonts/OFL.txt) */}
          <p
            style={{
              ...SECTION_LABEL,
              margin: '0 0 var(--space-2)',
            }}
          >
            Fonts
          </p>
          <p
            data-testid="credits-fonts"
            style={{
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              margin: '0 0 var(--space-6)',
            }}
          >
            {/* The three faces the game ships (THR-1833); JSX text, not a face literal. */}
            Cinzel, Alegreya and Alegreya Sans, under the SIL Open Font Licence 1.1.
          </p>

          {/* Icons (THR-1904, plan THR-1879 § 8): CC BY 3.0 attribution, authors read from the registry */}
          <p
            style={{
              ...SECTION_LABEL,
              margin: '0 0 var(--space-2)',
            }}
          >
            Icons
          </p>
          <p
            data-testid="credits-icons"
            style={{
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              margin: '0 0 var(--space-6)',
            }}
          >
            Icons by {joinNames(ICON_CREDITS)}, from{' '}
            <a href={GAME_ICONS_SOURCE.site} target="_blank" rel="noreferrer" style={LINK}>game-icons.net</a>, used under the
            Creative Commons Attribution 3.0 licence (
            <a href={GAME_ICONS_SOURCE.licenceUrl} target="_blank" rel="noreferrer" style={LINK}>creativecommons.org/licenses/by/3.0</a>
            ). Recoloured for this game.
          </p>

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
