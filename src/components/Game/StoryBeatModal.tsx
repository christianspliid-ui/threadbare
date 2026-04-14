/**
 * StoryBeatModal — full-screen interrupt modal for story-beat-tier encounters.
 *
 * Fires when the pacing governor fires a story_beat encounter. The simulation
 * auto-pauses while this modal is open. The player reads the encounter details
 * and dismisses to auto-resolve in the background, returning to normal play.
 */

import { memo } from 'react';
import { Modal } from '../shared/Modal';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

// ─── Props ──────────────────────────────────────────────────────────

interface StoryBeatModalProps {
  open: boolean;
  onDismiss: () => void;
  template: UnifiedActionTemplate | null;
  agentName: string;
}

// ─── Reach Badge ────────────────────────────────────────────────────

function ReachBadge({ reach }: { reach: string }) {
  return (
    <span style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '4px',
      padding: '2px 8px',
      fontFamily: 'var(--font-display)',
      fontSize: '0.7rem',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)',
    }}>
      {reach}
    </span>
  );
}

// ─── Component ──────────────────────────────────────────────────────

export const StoryBeatModal = memo(function StoryBeatModal({
  open,
  onDismiss,
  template,
  agentName,
}: StoryBeatModalProps) {
  if (!template) return null;

  return (
    <Modal
      open={open}
      onClose={onDismiss}
      aria-label={`Story beat: ${template.name}`}
    >
      <Modal.Header>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-1)',
          alignItems: 'center',
          textAlign: 'center',
          padding: 'var(--space-2) 0',
        }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.65rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--accent-gold)',
          }}>
            Story Beat
          </span>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)',
            color: 'var(--text-primary)',
            margin: 0,
          }}>
            {template.name}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {agentName}
            </span>
            <ReachBadge reach={template.reach} />
          </div>
        </div>
      </Modal.Header>
      <Modal.Body>
        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          fontStyle: 'italic',
          textAlign: 'center',
          margin: '0 0 var(--space-4)',
        }}>
          {template.description}
        </p>

        {template.narrativeTemplates?.initiation && (
          <p style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            textAlign: 'center',
            margin: '0 0 var(--space-4)',
          }}>
            {template.narrativeTemplates.initiation}
          </p>
        )}

        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          padding: 'var(--space-3)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}>
          This encounter is unfolding in the world. The outcome will be resolved automatically.
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={onDismiss}
            style={{
              background: 'var(--accent-gold)',
              color: 'var(--bg-base)',
              border: 'none',
              borderRadius: '4px',
              padding: 'var(--space-2) var(--space-6)',
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-sm)',
              letterSpacing: '0.06em',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Continue
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
});
