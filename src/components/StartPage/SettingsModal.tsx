import { useState } from 'react';
import { Modal } from '../shared/Modal';
import { VERSION_STAMP_TEXT } from './startPageConstants';

const FOG_DEFAULT_STORAGE_KEY = 'threadbearer_fog_default';

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: 'var(--space-2)',
};

const VALUE_STYLE: React.CSSProperties = {
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-base)',
};

const SECTION_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  volume: number;
  onVolumeChange: (v: number) => void;
  muted: boolean;
  onToggleMute: () => void;
}

export function SettingsModal({ open, onClose, volume, onVolumeChange, muted, onToggleMute }: SettingsModalProps) {
  const [fogDefault, setFogDefault] = useState<boolean>(
    () => localStorage.getItem(FOG_DEFAULT_STORAGE_KEY) === 'true',
  );

  function handleFogToggle(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.checked;
    setFogDefault(next);
    localStorage.setItem(FOG_DEFAULT_STORAGE_KEY, String(next));
  }

  return (
    <Modal open={open} onClose={onClose}>
      <Modal.Header onClose={onClose}>Settings</Modal.Header>
      <Modal.Body>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

          {/* Volume control */}
          <div style={SECTION_STYLE}>
            <label style={LABEL_STYLE}>Music Volume</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                style={{
                  flex: 1,
                  accentColor: 'var(--accent-gold)',
                  cursor: 'pointer',
                }}
              />
              <span style={{ ...VALUE_STYLE, minWidth: '3ch', textAlign: 'right' }}>
                {Math.round(volume * 100)}%
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <input
                type="checkbox"
                id="settings-mute"
                checked={muted}
                onChange={onToggleMute}
                style={{ accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
              />
              <label
                htmlFor="settings-mute"
                style={{ ...VALUE_STYLE, cursor: 'pointer' }}
              >
                Muted
              </label>
            </div>
          </div>

          {/* Fog of War toggle */}
          <div style={SECTION_STYLE}>
            <label style={LABEL_STYLE}>Fog of War on Start</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <input
                type="checkbox"
                id="settings-fog"
                checked={fogDefault}
                onChange={handleFogToggle}
                style={{ accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
              />
              <label
                htmlFor="settings-fog"
                style={{ ...VALUE_STYLE, cursor: 'pointer' }}
              >
                Enable fog of war when starting a new world
              </label>
            </div>
          </div>

          {/* Version display */}
          <div style={SECTION_STYLE}>
            <span style={LABEL_STYLE}>Version</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <span style={VALUE_STYLE}>{VERSION_STAMP_TEXT}</span>
              <span style={{ ...VALUE_STYLE, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                Seed: 42
              </span>
            </div>
          </div>

        </div>
      </Modal.Body>
    </Modal>
  );
}
